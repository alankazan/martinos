#!/usr/bin/env python3
"""
MediaLauncher backend
Porta: 5174

Endpoints:
  POST /api/launch                { exec, url, openMode }
  GET  /api/docker                → lista containers
  POST /api/docker/start          { name }
  POST /api/docker/stop           { name }
  POST /api/docker/restart        { name }
  POST /api/volume/up
  POST /api/volume/down
  POST /api/volume/mute
  GET  /api/volume/level          → { level, muted }
  POST /api/media/play-pause
  POST /api/media/next
  POST /api/media/previous
  POST /api/media/stop
  GET  /api/scan                  → apps do sistema (.desktop)
  POST /api/screenshot
  POST /api/terminal
  POST /api/reboot
"""
import subprocess, json, os, glob, configparser, time, threading
from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_socketio import SocketIO, emit

app = Flask(__name__)
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='threading')

ICON_PATHS = [
    os.path.expanduser("~/.local/share/icons"),
    "/usr/share/icons/hicolor/48x48/apps",
    "/usr/share/icons/hicolor/scalable/apps",
    "/usr/share/icons/hicolor/128x128/apps",
    "/usr/share/pixmaps",
]

def find_icon(icon_name):
    if not icon_name: return None
    if os.path.isabs(icon_name) and os.path.exists(icon_name):
        return icon_name
    
    for p in ICON_PATHS:
        # Tenta extensões comuns
        for ext in ['.png', '.svg', '.xpm', '']:
            full = os.path.join(p, icon_name + ext)
            if os.path.exists(full):
                return full
    return None


def run(cmd, timeout=8):
    try:
        return subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=timeout)
    except subprocess.TimeoutExpired:
        return None


# ── Launch ────────────────────────────────────────────────────────
@app.route('/api/launch', methods=['POST'])
def launch():
    d = request.json or {}
    exec_cmd = d.get('exec', '')
    url = d.get('url', '')
    mode = d.get('openMode', 'tab')

    if mode == 'kiosk' and url:
        cmd = f'chromium --kiosk --new-window "{url}" &'
    elif mode == 'tab' and url:
        cmd = f'xdg-open "{url}" &'
    elif mode == 'terminal' and exec_cmd:
        # Tenta alacritty, depois xterm
        cmd = f'nohup alacritty -e {exec_cmd} >/dev/null 2>&1 || xterm -e {exec_cmd} &'
    elif exec_cmd:
        cmd = f'nohup {exec_cmd} >/dev/null 2>&1 &'
    else:
        return jsonify({'error': 'no command'}), 400

    run(cmd)
    return jsonify({'ok': True})


# ── Volume ────────────────────────────────────────────────────────
@app.route('/api/volume/up', methods=['POST'])
def vol_up():
    run('pactl set-sink-volume @DEFAULT_SINK@ +5%')
    return jsonify({'ok': True})

@app.route('/api/volume/down', methods=['POST'])
def vol_down():
    run('pactl set-sink-volume @DEFAULT_SINK@ -5%')
    return jsonify({'ok': True})

@app.route('/api/volume/mute', methods=['POST'])
def vol_mute():
    run('pactl set-sink-mute @DEFAULT_SINK@ toggle')
    return jsonify({'ok': True})

@app.route('/api/volume/level')
def vol_level():
    r = run("pactl get-sink-volume @DEFAULT_SINK@")
    muted = run("pactl get-sink-mute @DEFAULT_SINK@")
    level = 0
    is_muted = False
    if r and r.stdout:
        import re
        m = re.search(r'(\d+)%', r.stdout)
        if m:
            level = int(m.group(1))
    if muted and muted.stdout:
        is_muted = 'yes' in muted.stdout.lower()
    return jsonify({'level': level, 'muted': is_muted})


# ── Media (playerctl) ─────────────────────────────────────────────
@app.route('/api/media/play-pause', methods=['POST'])
def play_pause():
    run('playerctl play-pause')
    return jsonify({'ok': True})

@app.route('/api/media/next', methods=['POST'])
def media_next():
    run('playerctl next')
    return jsonify({'ok': True})

@app.route('/api/media/previous', methods=['POST'])
def media_previous():
    run('playerctl previous')
    return jsonify({'ok': True})

@app.route('/api/media/stop', methods=['POST'])
def media_stop():
    run('playerctl stop')
    return jsonify({'ok': True})


# ── Docker ────────────────────────────────────────────────────────
@app.route('/api/docker')
def docker_list():
    r = run("docker ps -a --format '{{json .}}'")
    containers = []
    if r and r.stdout:
        for line in r.stdout.strip().splitlines():
            if not line:
                continue
            try:
                c = json.loads(line)
                containers.append({
                    'id':      c.get('ID', ''),
                    'name':    c.get('Names', ''),
                    'image':   c.get('Image', ''),
                    'status':  c.get('Status', ''),
                    'running': c.get('State', '') == 'running',
                })
            except Exception:
                pass
    return jsonify(containers)

@app.route('/api/docker/start', methods=['POST'])
def docker_start():
    name = (request.json or {}).get('name', '')
    if not name:
        return jsonify({'error': 'no name'}), 400
    run(f'docker start {name}')
    return jsonify({'ok': True})

@app.route('/api/docker/stop', methods=['POST'])
def docker_stop():
    name = (request.json or {}).get('name', '')
    run(f'docker stop {name}')
    return jsonify({'ok': True})

@app.route('/api/docker/restart', methods=['POST'])
def docker_restart():
    name = (request.json or {}).get('name', '')
    run(f'docker restart {name}')
    return jsonify({'ok': True})

@app.route('/api/docker/logs', methods=['POST'])
def docker_logs():
    name = (request.json or {}).get('name', '')
    if not name: return jsonify({'error': 'no name'}), 400
    # Abre logs em um terminal separado
    cmd = f'nohup alacritty -e docker logs -f {name} >/dev/null 2>&1 || xterm -e docker logs -f {name} &'
    run(cmd)
    return jsonify({'ok': True})


# ── Scan .desktop files ───────────────────────────────────────────
@app.route('/api/scan')
def scan_apps():
    search_dirs = [
        '/usr/share/applications',
        os.path.expanduser('~/.local/share/applications'),
    ]
    apps = []
    seen = set()
    for d in search_dirs:
        for f in glob.glob(os.path.join(d, '*.desktop')):
            cp = configparser.ConfigParser(interpolation=None, strict=False)
            try:
                cp.read(f, encoding='utf-8')
                sect = 'Desktop Entry'
                if not cp.has_section(sect):
                    continue
                if cp.get(sect, 'Type', fallback='') != 'Application':
                    continue
                if cp.getboolean(sect, 'NoDisplay', fallback=False):
                    continue
                name = cp.get(sect, 'Name', fallback='').strip()
                exec_cmd = cp.get(sect, 'Exec', fallback='').strip()
                exec_cmd = ' '.join(w for w in exec_cmd.split() if not w.startswith('%'))
                icon_name = cp.get(sect, 'Icon', fallback='').strip()
                icon_path = find_icon(icon_name)
                
                cats = cp.get(sect, 'Categories', fallback='')
                if not name or not exec_cmd or name in seen:
                    continue
                seen.add(name)

                # Map .desktop categories to launcher categories
                cat = 'Utilitários'
                cats_lower = cats.lower()
                if any(k in cats_lower for k in ('game',)):
                    cat = 'Jogos'
                elif any(k in cats_lower for k in ('video', 'player', 'multimedia')):
                    cat = 'Vídeo'
                elif any(k in cats_lower for k in ('audio', 'music')):
                    cat = 'Mídia'

                apps.append({
                    'name': name,
                    'exec': exec_cmd,
                    'icon': icon_name,
                    'icon_path': icon_path,
                    'category': cat,
                    'source': 'native',
                })
            except Exception:
                pass
    return jsonify(apps)


# ── Screenshot ────────────────────────────────────────────────────
@app.route('/api/screenshot', methods=['POST'])
def screenshot():
    ts = int(time.time())
    out = os.path.expanduser(f'~/Imagens/screenshot_{ts}.png')
    os.makedirs(os.path.dirname(out), exist_ok=True)
    # Try spectacle (KDE), then scrot, then import (ImageMagick)
    cmds = [
        f'spectacle -b -n -o "{out}"',
        f'scrot "{out}"',
        f'import -window root "{out}"',
    ]
    for cmd in cmds:
        r = run(cmd, timeout=5)
        if r and r.returncode == 0:
            return jsonify({'ok': True, 'path': out})
    return jsonify({'ok': False, 'error': 'no screenshot tool found'})


# ── Terminal ──────────────────────────────────────────────────────
@app.route('/api/terminal', methods=['POST'])
def terminal():
    run('nohup alacritty >/dev/null 2>&1 &')
    return jsonify({'ok': True})


# ── Power / Reboot ────────────────────────────────────────────────
@app.route('/api/reboot', methods=['POST'])
def reboot():
    run('systemctl reboot')
    return jsonify({'ok': True})

@app.route('/api/poweroff', methods=['POST'])
def poweroff():
    run('systemctl poweroff')
    return jsonify({'ok': True})

# ── Icons ─────────────────────────────────────────────────────────
@app.route('/api/icon')
def get_icon():
    name = request.args.get('name', '')
    path = find_icon(name)
    if path and os.path.exists(path):
        from flask import send_file
        return send_file(path)
    return jsonify({'error': 'not found'}), 404


# ── System Info ───────────────────────────────────────────────────
@app.route('/api/sysinfo')
def sysinfo():
    return jsonify({
        'native_kb': os.environ.get('LAUNCHER_NATIVE_KB', 'auto'),
        'hostname': os.uname().nodename if hasattr(os, 'uname') else 'unknown',
        'user': os.environ.get('USER', 'unknown')
    })

# ── Background Monitoring ─────────────────────────────────────────
last_vol = {"level": 0, "muted": False}
last_docker = []

def monitor_system():
    global last_vol, last_docker
    while True:
        try:
            # Volume
            v = vol_level().get_json()
            if v != last_vol:
                last_vol = v
                socketio.emit('sys_volume', v)
            
            # Docker (mais lento)
            if time.time() % 2 < 0.5:
                d = docker_list().get_json()
                if d != last_docker:
                    last_docker = d
                    socketio.emit('sys_docker', d)
                    
            # Media
            r = run('playerctl metadata --format \'{"title":"{{title}}","artist":"{{artist}}","status":"{{status}}"}\'')
            if r and r.stdout:
                try:
                    m = json.loads(r.stdout)
                    socketio.emit('sys_media', m)
                except: pass
                
        except Exception as e:
            print(f"Monitor error: {e}")
        time.sleep(0.5)

@socketio.on('connect')
def handle_connect():
    print('Client connected')
    emit('sys_volume', last_vol)
    emit('sys_docker', last_docker)


if __name__ == '__main__':
    print('MartinsOS backend rodando em http://127.0.0.1:5174')
    # Inicia monitor em thread separada
    t = threading.Thread(target=monitor_system, daemon=True)
    t.start()
    socketio.run(app, host='127.0.0.1', port=5174, debug=False)
