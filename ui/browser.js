/* ============================================================
   VARIÁVEIS GLOBAIS E ESTADO DO SISTEMA
   ============================================================ */
let browser = document.getElementById("tab1");
let tabCount = 1;
let activeTab = "tab1";
let favorites = JSON.parse(localStorage.getItem("favorites")) || [];
let modalAction = null;
let lastSavedUrlByTab = {};
let monitorAreas = JSON.parse(localStorage.getItem("monitor_areas")) || [];

/* ============================================================
   INICIALIZAÇÃO E EVENTOS DE ENTRADA
   ============================================================ */
window.onload = () => {
    applyLanguage();
    renderFavorites();

    const primeiraWebview = document.getElementById("tab1");
    if (primeiraWebview) {
        // Remover o src inicial se houver para evitar o erro -3
        primeiraWebview.addEventListener('dom-ready', () => {
            if (!primeiraWebview.src || primeiraWebview.src === "about:blank") {
                primeiraWebview.loadURL("https://www.google.com");
            }
        });
        attachEventsToWebview(primeiraWebview, "tab1");
    }
    
    if (browser) attachEventsToWebview(browser, "tab1");

    const urlInput = document.getElementById("urlBar");
    if (urlInput) {
        urlInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                e.preventDefault();
                go();
            }
        });
        
        document.querySelectorAll(".browser").forEach(b => {
          b.style.position = "relative"
        })
        
    }

    setTimeout(() => {
        const container = document.getElementById("browserContainer");
        if (container) {
            container.style.display = 'none';
            container.offsetHeight; 
            container.style.display = 'flex';
        }
    }, 100);
};

/* ============================================================
   MOTOR DE NAVEGAÇÃO E LÓGICA DE URL
   ============================================================ */
function go() {
    let url = document.getElementById("urlBar").value.trim();
    if (!url) return;

    if (!url.startsWith("http://") && !url.startsWith("https://")) {
    try {
        // tenta validar como URL
        new URL("http://" + url);
        url = "http://" + url;
    } catch {
        // se falhar, vira busca
        url = "https://www.google.com/search?q=" + encodeURIComponent(url);
    }
}

    const active = document.querySelector(".browser.active");
    if (active) active.src = url;
}

window.back = () => { if (browser && browser.canGoBack()) browser.goBack(); };
window.forward = () => { if (browser && browser.canGoForward()) browser.goForward(); };
window.reload = () => { if (browser) browser.reload(); };
window.home = () => {
    const homeUrl = "https://www.google.com";
    if (browser) browser.src = homeUrl;
    document.getElementById("urlBar").value = homeUrl;
};

window.loadUrl = (url) => {
    const urlBar = document.getElementById("urlBar");
    if (urlBar) {
        urlBar.value = url;
        go();
    }
};


/* ============================================================
   SISTEMA DE FAVORITOS (REVISADO)
   ============================================================ */
window.toggleSidePanel = () => {
    const panel = document.getElementById("sidePanel");
    if(panel) panel.classList.toggle("open");
};

window.showFavorites = () => {

    resetSidePanel()

    const panel = document.getElementById("sidePanel")
    panel.classList.add("open")

    document.getElementById("sidePanelTitle").innerText = "⭐ Favoritos"

    const favContainer = document.getElementById("favoritesContainer")
    if(favContainer) favContainer.style.display = "block"

    const actions = document.querySelector(".sidePanelActions")
    if(actions) actions.style.display = "flex"

    renderFavorites()

}

window.addFavorite = function() {
    const url = document.getElementById("urlBar").value;
    const activeTabEl = document.querySelector(`[data-tab='${activeTab}'] .tabTitle`);
    const title = activeTabEl ? activeTabEl.innerText : "Novo Favorito";
    
    // Preencher o Select com as pastas existentes
    const select = document.getElementById("modalFolderSelect");
    select.innerHTML = '<option value="none">Nenhuma (Raiz)</option>';
    
    favorites.forEach((item, index) => {
        if (item.type === 'folder') {
            select.innerHTML += `<option value="${index}">${item.title}</option>`;
        }
    });

    openModal("Salvar Favorito", title, (nome) => {
        const folderIndex = document.getElementById("modalFolderSelect").value;
        const novoItem = { title: nome, url: url, type: 'link', id: Date.now() };

        if (folderIndex === "none") {
            favorites.push(novoItem);
        } else {
            if (!favorites[folderIndex].children) favorites[folderIndex].children = [];
            favorites[folderIndex].children.push(novoItem);
            favorites[folderIndex].expanded = true; // Abre a pasta para mostrar o novo item
        }
        saveFavorites();
    });
};

/* =========================
   FUNÇÕES DOS FAVORITOS (CORRIGIDAS)
   ========================= */
window.addFolder = function() {
    openModal("Nova Pasta", "Minhas Câmeras", (nome) => {
        if (nome && nome.trim() !== "") {
            favorites.push({ 
                title: nome.trim(), 
                type: 'folder', 
                expanded: false, 
                children: [],
                id: Date.now() 
            });
            saveFavorites();
        }
    });
};

function saveFavorites() {
    localStorage.setItem("favorites", JSON.stringify(favorites));
    renderFavorites();
}

function renderFavorites(){

const list = document.getElementById("favoritesList")
if(!list) return

list.ondragover = (e)=> e.preventDefault()

list.ondrop = (e)=>{

e.preventDefault()

const fromPath = e.dataTransfer.getData("text/plain")

if(!fromPath) return

moveToRoot(fromPath)

}

list.innerHTML=""

function renderItems(items,parent,path=[]){

items.forEach((item,index)=>{

const currentPath=[...path,index]

const div=document.createElement("div")
div.className="fav-item"

div.setAttribute("draggable","true")

div.ondragstart=(e)=>{
e.dataTransfer.setData("text/plain",currentPath.join("-"))
}

div.ondragover=(e)=>e.preventDefault()

div.ondrop=(e)=>{
e.preventDefault()

const fromPath=e.dataTransfer.getData("text/plain")
const toPath=currentPath.join("-")

handleDrop(fromPath,toPath)
}

const isFolder=item.type==="folder"

div.innerHTML=`

<div class="fav-entry">

<div style="display:flex;align-items:center;flex:1;overflow:hidden">

${isFolder ? `<span class="arrow">${item.expanded ? "▼":"▶"}</span>` : `<span style="width:15px"></span>`}

<span class="fav-link">

${isFolder 
? `📁 ${item.title}` 
: `<img src="https://www.google.com/s2/favicons?domain=${item.url}"
width="14"
height="14"
onerror="this.style.display='none'"> ${item.title}`}

</span>

</div>

<div class="fav-actions">
<button onclick="editFavorite(${currentPath.join(",")})">✏️</button>
<button onclick="deleteFavorite(${currentPath.join(",")})">🗑️</button>
</div>

</div>
`

parent.appendChild(div)

if(isFolder){

div.querySelector(".arrow").onclick=()=>{
item.expanded=!item.expanded
saveFavorites()
}

}

if(isFolder && item.expanded){

const sub=document.createElement("div")
sub.style.paddingLeft="20px"

renderItems(item.children||[],sub,currentPath)

parent.appendChild(sub)

}

})

}

renderItems(favorites,list)

}

function getItemByPath(path){

let current = favorites
let parent = null
let item = null

for(let i=0;i<path.length;i++){

parent = current
item = current[path[i]]

if(!item) return null

if(i < path.length-1){
current = item.children || []
}

}

return {parent,item,index:path[path.length-1]}

}

/* ============================================================
   SISTEMA DE BUSCA E LIMPEZA (RESTAURADO)
   ============================================================ */

// 1. Função que filtra e controla a visibilidade do X
window.searchFavorites = function(text) {
    const clearBtn = document.getElementById("clearSearchBtn");
    const searchText = text.toLowerCase().trim();
    
    // Mostra/Esconde o X
    if (clearBtn) clearBtn.style.display = text.length > 0 ? "block" : "none";

    const histResults = document.getElementById("historyResults");
        if (histResults && histResults.offsetParent !== null) {
            const entries = histResults.querySelectorAll(".fav-item"); // Alterado para .fav-item
            entries.forEach(el => {
                const content = el.innerText.toLowerCase();
                el.style.display = content.includes(searchText) ? "block" : "none";
            });
        }

    // Se estivermos no painel de favoritos
    const favList = document.getElementById("favoritesList");
    if (favList && favList.offsetParent !== null) {
        const items = favList.querySelectorAll(".fav-item");
        items.forEach(el => {
            const title = el.textContent.toLowerCase();
            el.style.display = title.includes(searchText) ? "block" : "none";
        });
    }

    // Se estivermos no painel de scanner (Busca nos resultados do scan)
    const scanResults = document.getElementById("scanResults");
    if (scanResults && scanResults.offsetParent !== null) {
        const rows = scanResults.querySelectorAll("div");
        rows.forEach(row => {
            const content = row.innerText.toLowerCase();
            row.style.display = content.includes(searchText) ? "block" : "none";
        });
    }
};

// 2. A função que o botão X chama (GARANTIDA NO WINDOW)
window.clearFavoritesSearch = function() {
    const input = document.getElementById("favoritesSearch");
    if (input) {
        input.value = ""; // Limpa o campo de texto
        window.searchFavorites(""); // Chama a função de cima para resetar a lista e sumir o X
        input.focus(); // Devolve o foco para o teclado
    }
};

function handleDrop(fromPath,toPath){

fromPath = fromPath.split("-").map(Number)
toPath = toPath.split("-").map(Number)

const source = getItemByPath(fromPath)
const target = getItemByPath(toPath)

if(!source || !target) return

// remover da origem
const movedItem = source.parent.splice(source.index,1)[0]

// destino
if(target.item.type === "folder"){

target.item.children = target.item.children || []
target.item.children.push(movedItem)
target.item.expanded = true

}else{

// inserir no mesmo nível
target.parent.splice(target.index,0,movedItem)

}

saveFavorites()

}

function moveToRoot(fromPath){

fromPath = fromPath.split("-").map(Number)

const source = getItemByPath(fromPath)

if(!source) return

const movedItem = source.parent.splice(source.index,1)[0]

favorites.push(movedItem)

saveFavorites()

}

window.toggleFolder = function(index) {
    if (favorites[index] && favorites[index].type === 'folder') {
        favorites[index].expanded = !favorites[index].expanded;
        saveFavorites();
    }
};

window.deleteFavorite = function(...path){

let current = favorites

for(let i=0;i<path.length-1;i++){
    current = current[path[i]].children
}
current.splice(path[path.length-1],1)
saveFavorites()
}

window.editFavorite = function(index, childIndex = null) {
    let item;
    if (childIndex === null) {
        item = favorites[index];
    } else {
        item = favorites[index].children[childIndex];
    }

    if (!item) return;

    openModal("Editar Nome", item.title, (novoNome) => {
        if (novoNome && novoNome.trim() !== "") {
            item.title = novoNome.trim();
            saveFavorites();
        }
    });
};

function openModal(title, defaultValue, onConfirm) {
    const modal = document.getElementById("customModal");
    const input = document.getElementById("modalInput");
    const titleEl = document.getElementById("modalTitle");
    const confirmBtn = document.getElementById("modalConfirm");

    titleEl.innerText = title;
    input.value = defaultValue;
    modal.style.display = "flex";
    input.focus();

    confirmBtn.onclick = () => {
        onConfirm(input.value);
        closeModal();
    };
}

function closeModal() {
    document.getElementById("customModal").style.display = "none";
}


// 3. Controla a abertura/fechamento da Ampulheta
window.toggleFilterMenu = function() {
    const menu = document.getElementById("filterMenu");
    if (menu) {
        const isHidden = menu.style.display === "none" || menu.style.display === "";
        menu.style.display = isHidden ? "block" : "none";
    }
};

// 4. FECHAR AO CLICAR FORA (A peça que faltava)
window.addEventListener("click", function(event) {
    if (!event.target.matches('#filterMenu') && !event.target.closest('.dropdown-filter')) {
        const menu = document.getElementById("filterMenu");
        if (menu && menu.classList.contains('show')) {
            menu.classList.remove('show');
        }
    }
});

// Função de Ordenação
window.sortMaster = function(type) {
    // Detecta qual container está visível
    const isHistoryOpen = document.getElementById("historyContainer").style.display === "block";
    const isFavoritesOpen = document.getElementById("favoritesContainer").style.display === "block";

    if (isHistoryOpen) {
        // Lógica para Histórico
        if (!historyList || historyList.length === 0) return;

        switch (type) {
            case 'name-asc': historyList.sort((a, b) => a.title.localeCompare(b.title)); break;
            case 'name-desc': historyList.sort((a, b) => b.title.localeCompare(a.title)); break;
            case 'date-new': historyList.sort((a, b) => new Date(b.date) - new Date(a.date)); break;
            case 'date-old': historyList.sort((a, b) => new Date(a.date) - new Date(b.date)); break;
        }
        localStorage.setItem("history", JSON.stringify(historyList));
        renderHistory();
    } 
    else if (isFavoritesOpen) {
        // Lógica para Favoritos
        if (!favorites || favorites.length === 0) return;

        switch (type) {
            case 'name-asc': favorites.sort((a, b) => a.title.localeCompare(b.title)); break;
            case 'name-desc': favorites.sort((a, b) => b.title.localeCompare(a.title)); break;
            case 'date-new': favorites.sort((a, b) => (b.id || 0) - (a.id || 0)); break;
            case 'date-old': favorites.sort((a, b) => (a.id || 0) - (b.id || 0));
        }
        saveFavorites();
    }

    // Fecha o menu de filtro após a ação
    const menu = document.getElementById("filterMenu");
    if (menu) menu.style.display = "none";
};

// Fechar filtro ao clicar fora

/* ============================================================
   GERENCIAMENTO DE ABAS E WEBVIEWS
   ============================================================ */
function attachEventsToWebview(targetWebview, tabId) {
    targetWebview.addEventListener("page-title-updated", (e) => {
        const tabTitle = document.querySelector(`[data-tab='${tabId}'] .tabTitle`);
        if (tabTitle) tabTitle.innerText = e.title;
    });

    targetWebview.addEventListener("did-navigate", (e) => {
        if (activeTab === tabId) {
            const urlBar = document.getElementById("urlBar");
            if (urlBar) urlBar.value = e.url;
        }
    });

   targetWebview.addEventListener("did-finish-load", () => {
        const url = targetWebview.getURL();
        const title = targetWebview.getTitle() || url;
        //console.log("HISTÓRICO:", window.addToHistory); // 👈 AQUI
        // Atualiza barra
        if (activeTab === tabId) {
            const urlBar = document.getElementById("urlBar");
            if (urlBar) urlBar.value = url;
        }

        // 🚫 evita duplicado na mesma aba
        if (lastSavedUrlByTab[tabId] === url) return;
        lastSavedUrlByTab[tabId] = url;

        // Salva histórico
        if (window.addToHistory) {
            window.addToHistory({
                title,
                url,
                date: new Date().toISOString()
            });
        }
    });

    targetWebview.addEventListener("did-navigate-in-page", (e) => {
        const url = e.url;
        const title = targetWebview.getTitle() || url;

        // evita duplicado
        if (lastSavedUrlByTab[tabId] === url) return;
        lastSavedUrlByTab[tabId] = url;

        if (window.addToHistory) {
            window.addToHistory({
                title,
                url,
                date: new Date().toISOString()
            });
        }

    });

    targetWebview.addEventListener("did-start-loading", () => {
        if (activeTab === tabId) updateStatus("loading");
    });

    targetWebview.addEventListener("did-stop-loading", () => {
        if (activeTab === tabId) updateStatus("ready");
    });

    targetWebview.addEventListener('did-fail-load', (e) => {
        if (e.errorCode === -3) {
            console.warn("Navegação cancelada ou sobreposta (ERR_ABORTED). Ignorando...");
            return;
        }
        console.error("Falha ao carregar:", e.errorDescription);
    });
}

window.newTab = function() {
    tabCount++;
    const tabId = "tab" + tabCount;
    const tab = document.createElement("div");
    tab.className = "tab";
    tab.dataset.tab = tabId;
    tab.innerHTML = `
        <span class="tabTitle">Nova Aba</span>
        <span class="closeTab" onclick="window.closeTab(event,'${tabId}')">✕</span>
    `;
    tab.onclick = () => switchTab(tabId);
    document.querySelector(".tabsBar").insertBefore(tab, document.querySelector(".newTabBtn"));

    const webview = document.createElement("webview");
    webview.src = "https://www.google.com";
    webview.className = "browser";
    webview.id = tabId;
    document.getElementById("browserContainer").appendChild(webview);
    attachEventsToWebview(webview, tabId);
    switchTab(tabId);
};

function switchTab(tabId) {
    document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
    document.querySelectorAll(".browser").forEach(b => b.classList.remove("active"));
    const targetTab = document.querySelector(`[data-tab='${tabId}']`);
    const targetBrowser = document.getElementById(tabId);
    if (targetTab && targetBrowser) {
        targetTab.classList.add("active");
        targetBrowser.classList.add("active");
        activeTab = tabId;
        browser = targetBrowser;
        document.getElementById("urlBar").value = browser.src;
    }
}

window.closeTab = function(event, tabId) {
    event.stopPropagation();
    const tab = document.querySelector(`[data-tab='${tabId}']`);
    const view = document.getElementById(tabId);
    if (tab) tab.remove();
    if (view) view.remove();
    if (activeTab === tabId) {
        const lastTab = document.querySelector(".tab");
        if (lastTab) switchTab(lastTab.dataset.tab);
    }
};

window.resetSidePanel = function() {
    // 1. Esconde a área de Favoritos (Actions e Content)
    const favActions = document.querySelector(".sidePanelActions");
    const favContent = document.querySelector(".sidePanelContent");
    const favFilter = document.querySelector(".dropdown-filter");
    
    if(favActions) favActions.style.display = "none";
    if(favContent) favContent.style.display = "none";
    if(favFilter) favFilter.style.display = "none";

    // 2. Esconde o e
    const scanner = document.getElementById("scannerContainer");
    if(scanner) scanner.style.display = "none";

    // 3. Esconde o Histórico (que vamos arrumar)
    const history = document.getElementById("historyContainer");
    if(history) history.style.display = "none";

    // 4. Esconde botões de topo extras
    const btnExcel = document.getElementById("btnExportScan");
    if(btnExcel) btnExcel.style.display = "none";
};

window.switchSidePanel = function(panel){

    const fav = document.getElementById("favoritesContainer")
    const scan = document.getElementById("scannerContainer")
    const hist = document.getElementById("historyContainer")

    if(fav) fav.style.display = "none"
    if(scan) scan.style.display = "none"
    if(hist) hist.style.display = "none"

    if(panel === "favorites"){
        fav.style.display = "block"
        document.getElementById("sidePanelTitle").innerText = "⭐ Favoritos"
    }

    if(panel === "scanner"){
        scan.style.display = "flex"
        document.getElementById("sidePanelTitle").innerText = "Scanner de Rede"
    }

    if(panel === "history"){
        hist.style.display = "block"
        document.getElementById("sidePanelTitle").innerText = "Histórico"
    }

    document.getElementById("sidePanel").classList.add("open")
}


/* ============================================================
   FUNÇÃO PARA ABRIR O SCANNER (RESTAURADA E LIMPA)
   ============================================================ */
window.openScanner = function() {
    // 1. Abre a lateral
    const sidePanel = document.getElementById("sidePanel");
    if (sidePanel) sidePanel.classList.add("open");
    
    // 2. Muda o título do topo
    document.getElementById("sidePanelTitle").innerText = "Scanner de Rede";

    // 3. LIMPEZA: Esconde Favoritos e Histórico para não misturar
    if(document.querySelector(".sidePanelActions")) document.querySelector(".sidePanelActions").style.display = "none";
    if(document.querySelector(".dropdown-filter")) document.querySelector(".dropdown-filter").style.display = "none";
    if(document.getElementById("historyContainer")) document.getElementById("historyContainer").style.display = "none";

    // 4. MOSTRA O SCANNER (Garanta que o ID no HTML seja 'scannerContainer')
    const scanner = document.getElementById("scannerContainer");
    if (scanner) {
        scanner.style.display = "flex";
        scanner.style.flexDirection = "column";
    } else {
        console.error("Erro: O elemento scannerContainer não foi encontrado no HTML.");
    }
    
    // 5. Mostra o botão do Excel (se ele existir no seu topo)
    const btnExport = document.getElementById("btnExportScan");
    if(btnExport) btnExport.style.display = "block";
};

/* ============================================================
   CONTROLADOR ÚNICO DO PAINEL LATERAL
   ============================================================ */

window.openPanel = function(panel) {
    const sidePanel = document.getElementById("sidePanel");
    
    // 1. MAPEAMENTO DE ELEMENTOS
    // Containers de conteúdo principal
    const containers = {
        fav: document.getElementById("favoritesContainer"),
        scan: document.getElementById("scannerContainer"),
        hist: document.getElementById("historyContainer"),
        monitor: document.getElementById("monitorControls")
    };
    
    // Elementos de UI específicos (ícones, botões e barras)
    const extraUi = {
        btnExcel: document.getElementById("btnExportScan"),
        iconAmpulheta: document.getElementById("favFilterIcon"),
        favActions: document.querySelector(".sidePanelActions") // Bloco Importar/Exportar
    };

    // 2. LIMPEZA TOTAL (Reset de Estado)
    // Esconde todos os containers principais
    Object.values(containers).forEach(el => { if(el) el.style.display = "none"; });
    
    // Esconde todos os elementos extras para não "vazar" em outras abas[cite: 6, 7]
    Object.values(extraUi).forEach(el => { if(el) el.style.display = "none"; });

    // 3. ATIVAÇÃO POR PAINEL
    switch(panel) {
        case "favorites":
            if(containers.fav) containers.fav.style.display = "block";
            if(extraUi.iconAmpulheta) extraUi.iconAmpulheta.style.display = "block";
            if(extraUi.favActions) extraUi.favActions.style.display = "flex";
            document.getElementById("sidePanelTitle").innerText = "⭐ Favoritos";
            if(typeof renderFavorites === "function") renderFavorites();
            break;

        case "scanner":
            if(containers.scan) containers.scan.style.display = "flex";
            if(extraUi.btnExcel) extraUi.btnExcel.style.display = "block";
            document.getElementById("sidePanelTitle").innerText = "Scanner de Rede";
            break;

        case "history":
            if(containers.hist) containers.hist.style.display = "block";
            if(extraUi.iconAmpulheta) extraUi.iconAmpulheta.style.display = "block";
            document.getElementById("sidePanelTitle").innerText = "Histórico";
            if(typeof renderHistory === "function") renderHistory();
            break;

        case "monitor":
            if(containers.monitor) containers.monitor.style.display = "block";
            document.getElementById("sidePanelTitle").innerText = "📹 Monitoramento";
            break;
    }

    // 4. Abertura do Painel Lateral
    if(sidePanel) sidePanel.classList.add("open");
};


/* ============================================================
   IDIOMAS E EXPORT
   ============================================================ */
window.setLanguage = function(lang) {
    localStorage.setItem("language", lang);
    applyLanguage();
};

function applyLanguage() {
    let lang = localStorage.getItem("language") || "pt";
    const translations = {
        pt: { url: "Digite IP ou endereço do site", go: "Ir", file: "Arquivo", tools: "Ferramentas", win: "Windows", lang: "Idioma" },
        en: { url: "Enter IP or website address", go: "Go", file: "File", tools: "Tools", win: "Window", lang: "Language" },
        es: { url: "Ingrese IP o direção", go: "Ir", file: "Archivo", tools: "Herramientas", win: "Ventana", lang: "Idioma" }
    };
    const t = translations[lang];
    document.getElementById("urlBar").placeholder = t.url;
    document.getElementById("goBtn").innerText = t.go;
    document.getElementById("menuFile").innerText = t.file;
    document.getElementById("menuTools").childNodes[0].nodeValue = t.tools + " ";
    document.getElementById("menuWindows").childNodes[0].nodeValue = t.win + " ";
    document.getElementById("menuLanguage").innerText = t.lang;
}

function updateStatus(state) {
    let lang = localStorage.getItem("language") || "pt";
    const statusText = document.getElementById("statusText");
    if (!statusText) return;
    const msg = {
        loading: { pt: "Carregando...", en: "Loading...", es: "Cargando..." },
        ready: { pt: "Pronto", en: "Ready", es: "Listo" }
    };
    statusText.innerText = msg[state][lang];
}

window.exportFavorites = function() {
    // 1. Verifica se tem favoritos
    if (!favorites || favorites.length === 0) {
        alert("Não há favoritos para exportar.");
        return;
    }

    // 2. Transforma os favoritos em texto (JSON)
    const data = JSON.stringify(favorites, null, 2);
    
    // 3. Em vez de criar Blob e Link (o que dava erro),
    // nós enviamos os dados direto para o "coração" do App (main.js)
    const { ipcRenderer } = require('electron');
    ipcRenderer.send('salvar-favoritos-natura', data);
};

window.importFavorites = function() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = ".json";
    input.title = "Importar Favoritos"; // Sugestão para o sistema

    input.onchange = e => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.readAsText(file, 'UTF-8');
        reader.onload = re => {
            try {
                const imported = JSON.parse(re.target.result);
                if (Array.isArray(imported)) {
                    favorites = imported;
                    saveFavorites();
                    alert("Favoritos importados com sucesso!");
                }
            } catch (err) {
                alert("Erro: O arquivo selecionado não é um backup de favoritos válido.");
            }
        };
    };
    input.click();
};

window.openDevTools = function() {

    // limpa qualquer painel aberto
    const fav = document.getElementById("favoritesContainer")
    const scan = document.getElementById("scannerContainer")
    const hist = document.getElementById("historyContainer")

    if(fav) fav.style.display = "none"
    if(scan) scan.style.display = "none"
    if(hist) hist.style.display = "none"

    // fecha o painel lateral
    const side = document.getElementById("sidePanel")
    if(side) side.classList.remove("open")

    // abre o DevTools
    const { ipcRenderer } = require('electron')
    ipcRenderer.send("abrir-console")
}

// ============================
// MODO MONITORAMENTO (NOVO)
// ============================
window.monitorMode = function () {

    const tabId = "monitorTab";

    // evita duplicar
    if (document.getElementById(tabId)) {
        switchTab(tabId);
        openPanel("monitor");
        return;
    }

    const tab = document.createElement("div");
    tab.className = "tab";
    tab.dataset.tab = tabId;

    tab.innerHTML = `
        <span class="tabTitle">📹 Monitoramento</span>
        <span class="closeTab" onclick="closeTab(event,'${tabId}')">✕</span>
    `;

    tab.onclick = () => switchTab(tabId);

    document.querySelector(".tabsBar")
        .insertBefore(tab, document.querySelector(".newTabBtn"));

    const webview = document.createElement("webview");
    webview.id = tabId;
    webview.className = "browser";

    // 🔥 CORREÇÃO IMPORTANTE
    webview.src = "./monitor.html";

    document.getElementById("browserContainer").appendChild(webview);

    attachEventsToWebview(webview, tabId);

    // 🔥 ESPERA CARREGAR
    webview.addEventListener("dom-ready", () => {

        const savedGrid = localStorage.getItem("monitor_grid") || 4;

        webview.executeJavaScript(`
            if(window.setGrid){
                window.setGrid(${savedGrid});
            }
        `);

    });

    switchTab(tabId);
    openPanel("monitor");
};



window.zoom = function(type){
    console.log("Zoom:", type);
};



// Função para abrir uma área e mudar o título
window.loadArea = function(areaName) {
    const area = monitorAreas.find(a => a.name === areaName);
    if (!area) return;

    // Altera o título da aba/janela
    const activeTabEl = document.querySelector(`.tab[data-tab="${activeTab}"] .tabTitle`);
    if (activeTabEl) activeTabEl.innerText = `📹 ${area.name}`;
    
    // Altera o título da janela principal (Electron)
    document.title = `CFTV PRO - ${area.name}`;

    // Carrega o grid apropriado (ex: se tem 6 cameras, carrega grid de 9)
    const qtd = area.cameras.length;
    let gridSize = qtd <= 1 ? 1 : (qtd <= 4 ? 4 : (qtd <= 9 ? 9 : 16));
    
    // Chama a função do monitor.html via executeJavaScript
    const monitorWebview = document.getElementById("monitorTab");
    if (monitorWebview) {
        monitorWebview.executeJavaScript(`
            window.setGrid(${gridSize});
            ${JSON.stringify(area.cameras)}.forEach((url, i) => window.loadCamera(i, url));
        `);
    }
};

// Renderiza a lista estilo árvore (Pastas e Câmeras)
window.renderVMSTree = function() {
    const tree = document.getElementById("vmsTree");
    tree.innerHTML = "";

    monitorAreas.forEach(area => {
        const areaDiv = document.createElement("div");
        areaDiv.className = "tree-folder";
        areaDiv.innerHTML = `
            <div class="folder-header" onclick="loadArea('${area.name}')">
                <span>📁 ${area.name}</span>
                <span class="status-dot online"></span>
            </div>
            <div class="folder-content">
                ${area.cameras.map(cam => `
                    <div class="tree-item" draggable="true" ondragstart="dragCam(event, '${cam}')">
                        <span>📹 ${cam}</span>
                        <div class="cam-info">
                            <span class="live-indicator">LIVE</span>
                            <span class="time-counter">00:00:00</span>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
        tree.appendChild(areaDiv);
    });
};

// Localiza o webview que contém o monitor.html
function getMonitorView() {
    return document.getElementById("monitorTab");
}

window.setGrid = function(qtd) {
    const monitor = getMonitorView();
    if (!monitor) return;

    localStorage.setItem("monitor_grid", qtd);

    monitor.executeJavaScript(`
        if(window.setGrid){
            window.setGrid(${qtd});
        }
    `);
};

// Comando de Movimentação PTZ
window.ptz = function(dir) {
    const monitor = getMonitorView();
    if (!monitor) return;
    
    console.log("Comando PTZ enviado:", dir);
    // Aqui você pode implementar a lógica de enviar para a API da câmera
    // Ou apenas um feedback visual no console por enquanto
    monitor.executeJavaScript(`console.log("Executando PTZ para: ${dir}")`);
};

// Gerenciamento de Áreas (VMS Tree)

window.toggleMosaicMenu = function() {
    const menu = document.getElementById("mosaicList");
    if (menu) {
        menu.style.display = menu.style.display === "block" ? "none" : "block";
    }
};

// Fechar menu de mosaico ao clicar fora
document.addEventListener('click', (e) => {
    if (!e.target.closest('.mosaic-dropdown')) {
        const menu = document.getElementById("mosaicList");
        if (menu) menu.style.display = "none";
    }
});

// Exemplo de como renderizar a lista de mosaicos com a opção de editar
function renderMosaicOptions() {
    const list = document.getElementById("mosaicList");
    list.innerHTML = `
        <div onclick="setGrid(1)">1x1 Standard <span onclick="editMosaic(1)">✏️</span></div>
        <div onclick="setGrid(4)">2x2 Quad <span onclick="editMosaic(4)">✏️</span></div>
        <div onclick="setGrid(9)">3x3 Matrix <span onclick="editMosaic(9)">✏️</span></div>
        <div class="divider"></div>
        <div onclick="createNewLayout()">+ Criar Novo Mosaico</div>
    `;
}