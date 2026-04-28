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
import subprocess, json, os, glob, configparser, time, threading, socket, psutil, requests
from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_socketio import SocketIO, emit
from functools import lru_cache

def get_local_ip():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except:
        return "127.0.0.1"

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

@lru_cache(maxsize=512)
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


# ── Update System ────────────────────────────────────────────────
INSTALL_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # /opt/martinos
update_log = []
update_status = "idle"  # idle | running | done | error

@app.route('/api/update/check')
def check_update():
    try:
        run('git fetch origin main')
        local = run('git rev-parse HEAD').stdout.strip()
        remote = run('git rev-parse origin/main').stdout.strip()
        has_update = local != remote
        msg = run('git log -1 --pretty=%B origin/main').stdout.strip()
        # Get list of changed files for smart restart decision
        changed = []
        if has_update:
            r = run(f'git diff --name-only HEAD origin/main')
            changed = r.stdout.strip().splitlines() if r and r.stdout else []
        return jsonify({
            'hasUpdate': has_update,
            'local': local[:7],
            'remote': remote[:7],
            'message': msg,
            'changedFiles': changed
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/update/status')
def update_status_route():
    return jsonify({'status': update_status, 'log': update_log[-20:]})

@app.route('/api/update/apply', methods=['POST'])
def apply_update():
    global update_log, update_status
    update_log = []
    update_status = "running"

    def _log(msg):
        update_log.append(msg)
        socketio.emit('sys_update_log', {'msg': msg})

    def do_update():
        global update_status
        try:
            _log("🔄 Buscando commits do GitHub...")
            r = run('git fetch origin main')

            # Check which files changed
            changed_r = run('git diff --name-only HEAD origin/main')
            changed = changed_r.stdout.strip().splitlines() if changed_r and changed_r.stdout else []
            backend_changed = any('backend/' in f or f == 'requirements.txt' for f in changed)
            frontend_changed = any(f.startswith('src/') or f in ('package.json', 'vite.config.ts', 'index.html') for f in changed)

            _log(f"📂 Arquivos alterados: {', '.join(changed) if changed else 'nenhum'}")

            _log("⬇️ Aplicando atualizações (git pull)...")
            r = run('git pull origin main')
            if r.returncode != 0:
                _log(f"❌ git pull falhou: {r.stderr}")
                update_status = "error"
                socketio.emit('sys_update_done', {'ok': False})
                return

            if frontend_changed:
                _log("📦 Instalando dependências npm...")
                r = run('npm install --legacy-peer-deps', cwd=INSTALL_DIR)
                _log("🔨 Reconstruindo frontend (npm build)...")
                r = run('npm run build', cwd=INSTALL_DIR)
                if r.returncode != 0:
                    _log(f"❌ Build falhou: {r.stderr}")
                    update_status = "error"
                    socketio.emit('sys_update_done', {'ok': False})
                    return
                _log("✅ Frontend reconstruído com sucesso!")

            if backend_changed:
                _log("🐍 Backend modificado - reiniciando serviço...")
                run('pip install -r requirements.txt')
                # Schedule backend restart after response
                def restart_backend():
                    time.sleep(1)
                    run('systemctl restart martinos-backend')
                threading.Thread(target=restart_backend, daemon=True).start()

            _log("🚀 Enviando sinal de reload para o frontend...")
            update_status = "done"
            socketio.emit('sys_update_done', {'ok': True, 'backendRestart': backend_changed})

        except Exception as e:
            _log(f"❌ Erro inesperado: {str(e)}")
            update_status = "error"
            socketio.emit('sys_update_done', {'ok': False})

    threading.Thread(target=do_update, daemon=True).start()
    return jsonify({'ok': True, 'msg': 'Atualização iniciada em background'})


# ── Store System (Flatpak & Snap) ─────────────────────────────────
FEATURED_APPS = [
    {"id": "com.spotify.Client", "name": "Spotify", "description": "Música para todos.", "category": "Mídia", "source": "flatpak", "icon": "spotify"},
    {"id": "com.discordapp.Discord", "name": "Discord", "description": "Chat para gamers.", "category": "Social", "source": "flatpak", "icon": "discord"},
    {"id": "com.valvesoftware.Steam", "name": "Steam", "description": "A melhor plataforma de jogos.", "category": "Jogos", "source": "flatpak", "icon": "steam"},
    {"id": "org.videolan.VLC", "name": "VLC", "description": "O reprodutor de mídia universal.", "category": "Mídia", "source": "flatpak", "icon": "vlc"},
    {"id": "com.visualstudio.code", "name": "VS Code", "description": "Editor de código profissional.", "category": "Desenvolvimento", "source": "flatpak", "icon": "vscode"},
    {"id": "org.mozilla.firefox", "name": "Firefox", "description": "Navegador web livre e aberto.", "category": "Internet", "source": "flatpak", "icon": "firefox"},
    {"id": "org.retroarch.RetroArch", "name": "RetroArch", "description": "Emulador de consoles clássicos.", "category": "Jogos", "source": "flatpak", "icon": "retroarch"},
    {"id": "com.obsproject.Studio", "name": "OBS Studio", "description": "Gravação e streaming profissional.", "category": "Vídeo", "source": "flatpak", "icon": "obs"},
]

@app.route('/api/store/featured')
def store_featured():
    return jsonify(FEATURED_APPS)

@app.route('/api/store/search')
def store_search():
    query = request.args.get('q', '')
    if not query: return jsonify([])
    
    # Busca remota no Flathub
    r = run(f'flatpak search --columns=application,name,description,version {query}')
    if not r or not r.stdout: return jsonify([])
    
    lines = r.stdout.strip().split('\n')
    results = []
    for line in lines:
        parts = line.split('\t')
        if len(parts) >= 3:
            results.append({
                'id': parts[0].strip(),
                'name': parts[1].strip(),
                'description': parts[2].strip(),
                'version': parts[3].strip() if len(parts) > 3 else '',
                'source': 'flatpak'
            })
    return jsonify(results)

@app.route('/api/store/install', methods=['POST'])
def store_install():
    d = request.json or {}
    app_id = d.get('id')
    source = d.get('source', 'flatpak')
    if not app_id: return jsonify({'error': 'no id'}), 400
    
    if source == 'flatpak':
        r = run(f'flatpak install -y flathub {app_id}')
    elif source == 'snap':
        r = run(f'sudo snap install {app_id}')
    else:
        return jsonify({'error': 'Unknown source'}), 400

    if r.returncode != 0:
        return jsonify({'error': 'Install failed', 'details': r.stderr}), 500
    return jsonify({'ok': True})


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
        'user': os.environ.get('USER', 'unknown'),
        'ip': get_local_ip()
    })

# ── Smart Remote (xdotool) ────────────────────────────────────────
@app.route('/api/remote/mouse', methods=['POST'])
def remote_mouse():
    d = request.json or {}
    dx, dy = d.get('dx', 0), d.get('dy', 0)
    run(f'xdotool mousemove_relative -- {dx} {dy}')
    return jsonify({'ok': True})

@app.route('/api/remote/click', methods=['POST'])
def remote_click():
    run('xdotool click 1')
    return jsonify({'ok': True})

@app.route('/api/remote/type', methods=['POST'])
def remote_type():
    text = (request.json or {}).get('text', '')
    if text:
        # Escape quotes
        safe_text = text.replace("'", "'\\''")
        run(f"xdotool type '{safe_text}'")
    return jsonify({'ok': True})

@app.route('/api/remote/key', methods=['POST'])
def remote_key():
    key = (request.json or {}).get('key', '')
    if key:
        run(f'xdotool key "{key}"')
    return jsonify({'ok': True})

# ── System Manager (Network & Bluetooth) ──────────────────────────
@app.route('/api/network/wifi')
def network_wifi():
    r = run('nmcli -t -f SSID,BSSID,SIGNAL,SECURITY,ACTIVE dev wifi')
    if not r or not r.stdout: return jsonify([])
    networks = []
    seen = set()
    for line in r.stdout.strip().splitlines():
        parts = line.split(':')
        if len(parts) >= 5:
            ssid = parts[0].replace('\\:', ':')
            if not ssid or ssid in seen: continue
            seen.add(ssid)
            networks.append({
                'ssid': ssid,
                'bssid': parts[1],
                'signal': int(parts[2]) if parts[2].isdigit() else 0,
                'security': parts[3],
                'active': parts[4] == 'yes'
            })
    return jsonify(networks)

@app.route('/api/network/connect', methods=['POST'])
def network_connect():
    d = request.json or {}
    ssid, password = d.get('ssid', ''), d.get('password', '')
    cmd = f'nmcli dev wifi connect "{ssid}" password "{password}"' if password else f'nmcli dev wifi connect "{ssid}"'
    r = run(cmd)
    if r and r.returncode == 0:
        return jsonify({'ok': True})
    return jsonify({'error': 'Failed to connect'}), 500

@app.route('/api/bluetooth/devices')
def bluetooth_devices():
    r = run('bluetoothctl devices')
    if not r or not r.stdout: return jsonify([])
    devices = []
    for line in r.stdout.strip().splitlines():
        parts = line.split(' ', 2)
        if len(parts) >= 3:
            devices.append({'mac': parts[1], 'name': parts[2]})
    return jsonify(devices)

@app.route('/api/bluetooth/scan', methods=['POST'])
def bluetooth_scan():
    state = (request.json or {}).get('state', 'on')
    run(f'bluetoothctl scan {state}')
    return jsonify({'ok': True})

@app.route('/api/bluetooth/pair', methods=['POST'])
def bluetooth_pair():
    mac = (request.json or {}).get('mac', '')
    run(f'bluetoothctl pair {mac}')
    run(f'bluetoothctl trust {mac}')
    run(f'bluetoothctl connect {mac}')
    return jsonify({'ok': True})


# ── Background Monitoring ─────────────────────────────────────────
last_vol = {"level": 0, "muted": False}
last_docker = []

def monitor_volume():
    """Monitor volume events via pactl subscribe"""
    global last_vol
    proc = subprocess.Popen(['pactl', 'subscribe'], stdout=subprocess.PIPE, text=True)
    
    # Send initial state
    v = vol_level().get_json()
    last_vol = v
    socketio.emit('sys_volume', v)

    for line in proc.stdout:
        if "sink" in line.lower() or "change" in line.lower():
            v = vol_level().get_json()
            if v != last_vol:
                last_vol = v
                socketio.emit('sys_volume', v)

def monitor_docker_media():
    """Monitor docker and media (polling, but slower/optimized)"""
    global last_docker
    while True:
        try:
            # Docker (poll every 2s instead of 0.5s)
            d = docker_list().get_json()
            if d != last_docker:
                last_docker = d
                socketio.emit('sys_docker', d)
                    
            # Media (poll every 1s)
            r = run('playerctl metadata --format \'{"title":"{{title}}","artist":"{{artist}}","status":"{{status}}"}\'')
            if r and r.stdout:
                try:
                    m = json.loads(r.stdout)
                    socketio.emit('sys_media', m)
                except: pass
                
        except Exception as e:
            print(f"Monitor error: {e}")
        time.sleep(1.5)

def monitor_system_health():
    """Monitor CPU, RAM and Temp"""
    while True:
        try:
            cpu = psutil.cpu_percent(interval=None)
            ram = psutil.virtual_memory().percent
            
            # Temperatura (pode falhar dependendo do hardware/OS)
            temp = 0
            try:
                temps = psutil.sensors_temperatures()
                if 'coretemp' in temps:
                    temp = temps['coretemp'][0].current
                elif 'cpu_thermal' in temps:
                    temp = temps['cpu_thermal'][0].current
            except: pass
            
            socketio.emit('sys_health', {
                'cpu': cpu,
                'ram': ram,
                'temp': temp
            })
        except Exception as e:
            print(f"Health Monitor error: {e}")
        time.sleep(2)

@socketio.on('connect')
def handle_connect():
    print('Client connected')
    emit('sys_volume', last_vol)
    emit('sys_docker', last_docker)
    emit('sys_update_status', {'status': update_status})


if __name__ == '__main__':
    print('MartinsOS backend rodando em http://127.0.0.1:5174')
    
    # Threads de monitoramento
    t_vol = threading.Thread(target=monitor_volume, daemon=True)
    t_docker = threading.Thread(target=monitor_docker_media, daemon=True)
    t_health = threading.Thread(target=monitor_system_health, daemon=True)
    
    t_vol.start()
    t_docker.start()
    t_health.start()
    
    # Signal that we are ready
    time.sleep(0.5)
    print('Sistema de monitoramento pronto.')
    
    socketio.run(app, host='0.0.0.0', port=5174, debug=False)
