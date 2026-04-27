let historyList = JSON.parse(localStorage.getItem("history")) || [];

window.addToHistory = function(item){

    // evitar duplicados seguidos
    if(historyList.length && historyList[0].url === item.url) return;

    historyList.unshift(item);

    // limite (opcional)
    if(historyList.length > 300) historyList.pop();
    
    if(historyList.length && historyList[0].url === item.url) return;

    localStorage.setItem("history", JSON.stringify(historyList));

    renderHistory();
}

function renderHistory(filter = ""){

    const container = document.getElementById("historyResults");
    if(!container) return;

    container.innerHTML = "";

    const now = new Date();

    const groups = {
        hoje: [],
        ontem: [],
        antigos: []
    };

    historyList.forEach(item => {

        if(filter && !item.title.toLowerCase().includes(filter.toLowerCase())) return;

        const itemDate = new Date(item.date);

        const diff = Math.floor((now - itemDate) / (1000*60*60*24));

        if(diff === 0) groups.hoje.push(item);
        else if(diff === 1) groups.ontem.push(item);
        else groups.antigos.push(item);

    });

    function createGroup(title, items){

        if(!items.length) return;

        const groupTitle = document.createElement("div");
        groupTitle.innerText = title;
        groupTitle.className = "history-group-title";
        container.appendChild(groupTitle);

        items.forEach(item => {

            const div = document.createElement("div");
                div.className = "fav-item"; // Mantendo a classe de container dos favoritos

                div.innerHTML = `
                <div class="fav-entry">
                    <div style="display:flex; align-items:center; flex:1; overflow:hidden; cursor:pointer;" onclick="loadUrl('${item.url}')">
                        <span style="width:15px"></span> <span class="fav-link">
                            <img src="https://www.google.com/s2/favicons?domain=${item.url}"
                                width="14" height="14"
                                onerror="this.style.display='none'"> 
                            ${item.title}
                        </span>
                    </div>

                    <div class="fav-actions">
                        <span style="font-size: 9px; color: #666; margin-right: 5px;">${formatTimeAgo(item.date)}</span>
                        <button onclick="addHistoryToFavorites('${item.title}','${item.url}')" title="Favoritar">⭐</button>
                        <button onclick="deleteHistoryItem('${item.date}')" title="Excluir">🗑️</button>
                    </div>
                </div>
                `;
                container.appendChild(div);
            });
    }
    createGroup("📅 Hoje", groups.hoje);
    createGroup("🕒 Ontem", groups.ontem);
    createGroup("📦 Antigos", groups.antigos);
}

function addHistoryToFavorites(title, url){

    if(!window.favorites) return;

    favorites.push({
        title: title,
        url: url,
        type: "link",
        id: Date.now()
    });

    localStorage.setItem("favorites", JSON.stringify(favorites));

    renderFavorites();
}


function deleteHistoryItem(date){

    historyList = historyList.filter(item => item.date !== date);

    localStorage.setItem("history", JSON.stringify(historyList));

    renderHistory();
}

window.clearHistory = function(){
    if(!confirm("Deseja apagar todo o histórico?")) return;

    historyList = [];
    localStorage.removeItem("history");
    renderHistory();
}

function formatTimeAgo(dateString){
    const now = new Date();
    const past = new Date(dateString);
    const diff = Math.floor((now - past) / 1000);

    if(diff < 60) return "agora";
    if(diff < 3600) return `há ${Math.floor(diff/60)} min`;
    if(diff < 86400) return `há ${Math.floor(diff/3600)} h`;
    if(diff < 172800) return "ontem";

    return past.toLocaleDateString();
}

// Exportar Histórico (Seguindo o padrão Natura do seu código)
window.exportHistory = function() {
    if (!historyList || historyList.length === 0) {
        alert("Não há histórico para exportar.");
        return;
    }

    const data = JSON.stringify(historyList, null, 2);
    const { ipcRenderer } = require('electron');
    // Usa o mesmo canal IPC que você já configurou para o navegador
    ipcRenderer.send('salvar-favoritos-natura', data);
};

// Importar Histórico
window.importHistory = function() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = ".json";

    input.onchange = e => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.readAsText(file, 'UTF-8');
        reader.onload = re => {
            try {
                const imported = JSON.parse(re.target.result);
                if (Array.isArray(imported)) {
                    historyList = imported;
                    localStorage.setItem("history", JSON.stringify(historyList));
                    renderHistory();
                    alert("Histórico importado com sucesso!");
                }
            } catch (err) {
                alert("Erro: Arquivo de backup inválido.");
            }
        };
    };
    input.click();
};

// Ordenação do Histórico (Botão Ampulheta)
window.sortHistory = function(type) {
    if (!historyList || historyList.length === 0) return;

    switch (type) {
        case 'name-asc':
            historyList.sort((a, b) => a.title.localeCompare(b.title));
            break;
        case 'name-desc':
            historyList.sort((a, b) => b.title.localeCompare(a.title));
            break;
        case 'date-new':
            historyList.sort((a, b) => new Date(b.date) - new Date(a.date));
            break;
        case 'date-old':
            historyList.sort((a, b) => new Date(a.date) - new Date(b.date));
            break;
    }

    localStorage.setItem("history", JSON.stringify(historyList));
    renderHistory();
    
    // Fecha o menu após selecionar
    const menu = document.getElementById("filterMenu");
    if (menu) menu.style.display = "none";
};