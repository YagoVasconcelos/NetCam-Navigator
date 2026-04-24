const net = require('net');
const { exec } = require('child_process');

let currentScanData = []; 

// --- MOTOR DE VARREDURA CORRIGIDO ---
window.startManualScan = function() {
    currentScanData = []; // Limpa dados anteriores
    const resultsArea = document.getElementById("scanResults");
    resultsArea.innerHTML = `<div id="statusScan" style="color:#ffd700; font-size:11px; padding:10px; font-family: sans-serif;">Varredura Geral Iniciada...</div>`;

    const startIp = document.getElementById("scanStart").value.trim();
    const endIp = document.getElementById("scanEnd").value.trim();
    
    const parts = startIp.split('.');
    const base = parts.slice(0, 3).join('.'); // Pega 172.30.23
    const startSuffix = parseInt(parts[3]); // Número inicial
    const endSuffix = parseInt(endIp.split('.').pop()); // Número final

    for (let i = startSuffix; i <= endSuffix; i++) {
        const ipCompleto = `${base}.${i}`; // AQUI GARANTIMOS O IP INTEIRO
        // Chama a função de ping que você já tem, passando o IP completo
        pingDevice(ipCompleto);
    }
};

// --- ATUALIZAÇÃO DA UI (SUBSTITUA AS DUAS QUE VOCÊ TEM POR ESTA ÚNICA) ---
function updateScanDataArray(ip, status, port) {
    const index = currentScanData.findIndex(item => item.ip === ip);
    if (index > -1) {
        currentScanData[index] = { ip, status, port };
    } else {
        currentScanData.push({ ip, status, port });
    }
    renderScanResults(); 
}

function pingDevice(ip, port) {
    const cmd = `ping -n 1 -w 300 ${ip}`;
    exec(cmd, (error, stdout) => {
        // Se TTL existe, é Verde (Online)
        if (!error && stdout.includes("TTL=")) {
            updateScanDataArray(ip, "online", port || "ICMP");
        } else {
            // Se falhou no ping, tenta portas para ver se é Amarelo (Falha) ou Vermelho (Offline)
            tryPorts(ip, port);
        }
    });
}

function tryPorts(ip, port) {
    const portsToTest = port ? [port] : [135, 80, 443, 8080];
    let found = false;
    let completed = 0;

    portsToTest.forEach(p => {
        const socket = new net.Socket();
        socket.setTimeout(250);
        socket.on('connect', () => {
            if (!found) {
                found = true;
                updateScanDataArray(ip, "warning", p); // AMARELO (Respondeu porta, mas não ping)
            }
            socket.destroy();
        });
        
        const checkDone = () => {
            completed++;
            if (completed === portsToTest.length && !found) {
                updateScanDataArray(ip, "offline", port || "N/A"); // VERMELHO (Morto)
            }
        };

        socket.on('error', () => { socket.destroy(); checkDone(); });
        socket.on('timeout', () => { socket.destroy(); checkDone(); });
        socket.connect(p, ip);
    });
}


// Vinculamos o evento de mudança do Select para atualizar a lista na hora
document.getElementById("scanSort").onchange = renderScanResults;

function renderScanResults() {
    const container = document.getElementById("scanResults");
    if (!container) return;

    // 1. Pega o tipo de filtro
    const sortType = document.getElementById("scanSort").value;

    // 2. Calcula os totais baseados no array global
    const online = currentScanData.filter(i => i.status === "online").length;
    const warning = currentScanData.filter(i => i.status === "warning").length;
    const offline = currentScanData.filter(i => i.status === "offline").length;

    // 3. Atualiza os IDs que estão fixos no seu index.html
    if(document.getElementById("statOnline")) document.getElementById("statOnline").innerText = `${online} ONLINE`;
    if(document.getElementById("statWarning")) document.getElementById("statWarning").innerText = `${warning} FALHA`;
    if(document.getElementById("statOffline")) document.getElementById("statOffline").innerText = `${offline} OFFLINE`;

    // 4. Limpa a área da lista para desenhar
    container.innerHTML = "";

    let displayData = [...currentScanData];

    // Lógica de FILTRO
    if (sortType === "online") {
        displayData = displayData.filter(i => i.status === "online");
    } else if (sortType === "offline") {
        displayData = displayData.filter(i => i.status === "offline");
    } else if (sortType === "fail") {
        displayData = displayData.filter(i => i.status === "warning");
    }

    // Lógica de ORDENAÇÃO
    if (sortType === "asc") {
        displayData.sort((a, b) => a.ip.localeCompare(b.ip, undefined, { numeric: true }));
    } else if (sortType === "desc") {
        displayData.sort((a, b) => b.ip.localeCompare(a.ip, undefined, { numeric: true }));
    }

    // 5. DESENHO DOS ITENS NA TELA
    displayData.forEach(item => {
        const colors = { online: "#4caf50", warning: "#ffeb3b", offline: "#f44336" };
        const statusTxt = { online: "ONLINE", warning: "FALHA", offline: "OFFLINE" };
        
        const div = document.createElement("div");
        div.style = "display:flex; justify-content:space-between; padding:8px 5px; border-bottom:1px solid #252525; align-items:center;";
        
        div.innerHTML = `
            <div style="display:flex; align-items:center; flex: 1; gap:8px; padding-left:5px; min-width:0;">
                <div style="width:7px; height:7px; border-radius:50%; background:${colors[item.status]}; box-shadow: 0 0 5px ${colors[item.status]}; flex-shrink:0;"></div>
                <span onclick="window.loadUrl('http://${item.ip}')" style="cursor:pointer; font-size:12px; color:#eee; font-family: monospace; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                    ${item.ip}
                </span>
            </div>
            <div style="width:50px; flex-shrink:0; text-align:center;">
                <span style="font-size:9px; color:#666; font-weight:bold; text-transform:uppercase; letter-spacing:0.3px;">${statusTxt[item.status]}</span>
            </div>
            <div class="fav-actions" style="display:flex; align-items:center; gap:12px; width:75px; justify-content:flex-end; padding-right:10px; flex-shrink:0;">
                <button onclick="window.identificarFabricante('${item.ip}')" title="Identificar" style="background:none; border:none; color:#777; cursor:pointer; font-size:12px; padding:0;">🔍</button>
                <button onclick="window.saveFoundIP('${item.ip}')" title="Salvar" style="background:none; border:none; color:#ffd700; cursor:pointer; font-size:13px; font-weight:bold; padding:0;">⭐+</button>
            </div>
        `;
        container.appendChild(div);
    });
}

function updateCounters() {
    const online = currentScanData.filter(i => i.status === "online").length;
    const warning = currentScanData.filter(i => i.status === "warning").length;
    const offline = currentScanData.filter(i => i.status === "offline").length;

    if(document.getElementById("countOnline")) document.getElementById("countOnline").innerText = `${online} ONLINE`;
    if(document.getElementById("countWarning")) document.getElementById("countWarning").innerText = `${warning} FALHA`;
    if(document.getElementById("countOffline")) document.getElementById("countOffline").innerText = `${offline} OFFLINE`;
}

function getMacAddress(ip) {
    try {
        // O comando 'arp -a [IP]' busca apenas o MAC desse IP específico
        const output = execSync(`arp -a ${ip}`).toString();
        
        // Regex aprimorada para capturar o MAC no formato do Windows
        const lines = output.split('\n');
        for (let line of lines) {
            if (line.includes(ip)) {
                const parts = line.trim().split(/\s+/);
                // No Windows, o MAC costuma ser a segunda coluna
                if (parts.length >= 2) {
                    const mac = parts[1].replace(/-/g, ':').toUpperCase();
                    if (mac.length === 17) return mac;
                }
            }
        }
        return "null";
    } catch (e) {
        return "null";
    }
}

window.identificarFabricante = function(ip) {
    const portaInput = document.getElementById("scanPort").value;
    const porta = parseInt(portaInput) || 80;
    const url = `http://${ip}:${porta}`;
    
    // Tabela de assinaturas comuns em CFTV
    let dica = "Fabricante Desconhecido";
    
    if (porta === 37777 || porta === 80) dica = "Possível Intelbras / Dahua";
    else if (porta === 8000 || porta === 8200) dica = "Possível Hikvision";
    else if (porta === 554) dica = "Stream de Vídeo (RTSP)";
    else if (porta === 34567) dica = "Possível XMeye / Genérico China";
    else if (porta === 8081) dica = "Possível Rádio Ubiquiti / AirOS";

    // Mostra a dica na barra de status para você saber antes de carregar
    const statusBar = document.querySelector('.statusBar');
    if (statusBar) {
        statusBar.innerText = `🔍 Identificando ${ip}: ${dica}`;
        statusBar.style.color = "#ffd700"; // Amarelo Natura
    }

    // Carrega o endereço no navegador
    if (window.loadUrl) {
        window.loadUrl(url);
    }
};

// Mantenha suas funções de exportScannerToExcel e clearResults como estão.
window.exportScannerToExcel = function() {
    const dados = currentScanData || [];
    if (dados.length === 0) return alert("Nada para exportar. Realize uma varredura primeiro.");

    // Ordem oficial Natura: IP;MAC;Mascara;Gateway;Suite;Porta_Equip;Porta_Switch
    let csvContent = "\ufeffIP;MAC_Address;Mascara;Gateway;Suite;Porta_Equipamento;Porta_Switch\n";

    dados.forEach(item => {
        const ip = item.ip.trim();
        const portaEquip = document.getElementById("scanPort").value || "80";
        
        // Como o ARP não alcança a outra VLAN, deixamos vazio para preenchimento manual no Excel
        const mac = ""; 

        // IP; MAC; Mascara; Gateway; Suite; Porta_Equip; Porta_Switch
        csvContent += `${ip};${mac};null;null;null;${portaEquip};null\n`;
    });

    const { ipcRenderer } = require('electron');
    ipcRenderer.send('salvar-favoritos-natura', csvContent);
};

window.clearScanResults = function() {
    // 1. Limpa a memória
    currentScanData = [];

    // 2. Limpa a tela de resultados
    const resultsArea = document.getElementById("scanResults");
    if (resultsArea) {
        resultsArea.innerHTML = "";
    }
    
    // 3. Opcional: Avisa na barra de status
    const statusBar = document.querySelector('.statusBar');
    if (statusBar) statusBar.innerText = "Varredura limpa!";
    
    console.log("Limpeza executada com sucesso.");
};