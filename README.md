# 🚀 NetCam Navigator
🖥️Gerenciamento inteligente de câmeras e redes 🔍

Sistema inteligente de navegação e monitoramento de rede com foco em gerenciamento de câmeras, dispositivos IP e organização avançada.

---

## 🧠 Sobre o Projeto

O **NetCam Navigator** é uma aplicação desktop baseada em Electron que integra:

* 🌐 Navegador embutido (multi-abas)
* ⭐ Sistema de favoritos avançado com pastas aninhadas
* 📡 Scanner de rede
* 🔎 Busca inteligente de dispositivos
* 📂 Organização hierárquica de câmeras e links

Projetado para:

* Sistemas de CFTV
* Técnicos de redes
* Monitoramento corporativo
* Suporte técnico

---

## ✨ Funcionalidades

### ⭐ Favoritos Inteligentes

* Criação de pastas e subpastas (ilimitado)
* Drag & Drop avançado
* Organização automática
* Busca em tempo real
* Ordenação:

  * A → Z
  * Z → A
  * Mais recentes
  * Mais antigos

---

### 📡 Scanner de Rede

* Interface dedicada
* Separação total do sistema de favoritos
* Base para expansão (exportação, análise, integração)

---

### 🌐 Navegador Integrado

* Sistema de abas
* Navegação rápida
* Atualização automática de título
* Suporte a IP e URLs

---

### 📤 Importação e Exportação

* Exportação em JSON
* Importação completa de estrutura
* Backup manual e automático

---

## 🏗️ Arquitetura do Projeto

/project
├── index.html
├── renderer.js
├── main.js
├── styles.css
├── assets/
└── README.md

---

## ⚙️ Tecnologias Utilizadas

* Electron
* JavaScript (Vanilla)
* HTML5
* CSS3
* LocalStorage

---

## 🧩 Estrutura de Dados dos Favoritos

```javascript
{
  title: "Nome do item",
  type: "folder" | "link",
  url: "http://...",
  children: [],
  expanded: true,
  id: Date.now()
}
```

---

## 🚀 Como Executar

```bash
npm install
npm start
```

---

## 📌 Roadmap

* [ ] Histórico de navegação completo
* [ ] Exportação do scanner para Excel
* [ ] Sistema de tags
* [ ] Tema dark/light
* [ ] Sincronização em nuvem
* [ ] Autenticação de usuário
* [ ] Integração com dispositivos de rede

---

## 🧑‍💻 Autor

**Yago Marinho**

---

## 📄 Licença

MIT License
