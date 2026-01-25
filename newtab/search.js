// ---------------------------------------------------------
// 1. Detect default search engine using test search method
// ---------------------------------------------------------

let selectedEngine = "google";
async function detectDefaultEngine() {
    return new Promise((resolve) => {
        const testQuery = "zzzzzz123456789_test_engine_detection";

        chrome.tabs.create({ url: "about:blank", active: false }, (tab) => {
            const tempTabId = tab.id;

            chrome.tabs.onUpdated.addListener(function listener(tabId, changeInfo, updatedTab) {
                if (tabId === tempTabId && changeInfo.status === "complete") {
                    const url = updatedTab.url || "";

                    let engine = "google"; // fallback
                    if (url.includes("bing.com")) engine = "bing";
                    else if (url.includes("duckduckgo.com")) engine = "duckduckgo";
                    else if (url.includes("yahoo.com")) engine = "yahoo";
                    else if (url.includes("google.")) engine = "google";

                    chrome.tabs.onUpdated.removeListener(listener);
                    chrome.tabs.remove(tempTabId);

                    resolve(engine);
                }
            });

            chrome.search.query({ text: testQuery });
        });
    });
}

// ---------------------------------------------------------
// 2. Suggestion API wrappers
// ---------------------------------------------------------

async function getGoogleSuggestions(q) {
    const url = `https://suggestqueries.google.com/complete/search?client=firefox&q=${encodeURIComponent(q)}`;
    const res = await fetch(url);
    return (await res.json())[1] || [];
}

async function getDuckDuckGoSuggestions(q) {
    const url = `https://duckduckgo.com/ac/?q=${encodeURIComponent(q)}`;
    const res = await fetch(url);
    const data = await res.json();
    return data.map(item => item.phrase);
}

async function getBingSuggestions(q) {
    // Bing AutoSuggest requires Azure API key → using placeholder URL
    // You must add your key here if you want Bing suggestions
    return [];
}

// ---------------------------------------------------------
// 3. Main suggestion handler
// ---------------------------------------------------------



async function initEngine() {
    selectedEngine = await detectDefaultEngine();
    console.log("Detected default search engine:", selectedEngine);
}

function getSuggestions(query) {
    if (selectedEngine === "duckduckgo") return getDuckDuckGoSuggestions(query);
    if (selectedEngine === "bing") return getBingSuggestions(query);
    return getGoogleSuggestions(query);
}



const input = document.getElementById("search-input");
const searchButton = document.getElementById("search-button");
const engineDropdown = document.getElementById("engine-dropdown");
const engineSelected = document.getElementById("engine-selected");
const engineList = document.getElementById("engine-list");


const ENGINE_CLASSES = {
    google: "google",
    bing: "bing",
    duckduckgo: "duckduckgo"
};

const ENGINE_URLS = {
    google: (q) => `https://www.google.com/search?q=${encodeURIComponent(q)}`,
    bing: (q) => `https://www.bing.com/search?q=${encodeURIComponent(q)}`,
    duckduckgo: (q) => `https://duckduckgo.com/?q=${encodeURIComponent(q)}`
};




// Load engine from storage
chrome.storage.sync.get(["searchEngine"], (result) => {
    if (result.searchEngine && ENGINE_CLASSES[result.searchEngine]) {
        selectedEngine = result.searchEngine;
    }
    setEngineIcon(selectedEngine);
});

function setEngineIcon(engine) {
    engineSelected.className = "engine-icon " + ENGINE_CLASSES[engine];
}

function setEngine(engine) {
    selectedEngine = engine;
    setEngineIcon(engine);
    chrome.storage.sync.set({ searchEngine: engine });
}

engineDropdown.addEventListener("click", (e) => {
    engineList.style.display = engineList.style.display === "block" ? "none" : "block";
});

engineDropdown.addEventListener("blur", () => {
    setTimeout(() => { engineList.style.display = "none"; }, 150);
});

engineList.querySelectorAll("li").forEach((li) => {
    li.addEventListener("click", (e) => {
        setEngine(li.getAttribute("data-engine"));
        engineList.style.display = "none";
    });
});

function runSearch(query) {
    if (!query) return;
    const url = ENGINE_URLS[selectedEngine](query);
    window.open(url, "_blank");
}

input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        e.preventDefault();
        runSearch(input.value.trim());
    }
});

searchButton.addEventListener("click", () => {
    runSearch(input.value.trim());
});

// ---------------------------------------------------------
// Website icon mapping for common services
// ---------------------------------------------------------


function getIconForDomain(url) {
    let hostname = "";
    try {
        hostname = tldts.parse(url).domain;
    } catch {
        return "https://icon.horse/icon/default";
    }

    // 1. SPECIAL RULES (contains multiple keywords)
    for (const rule of FAVICON_RULES) {
        if (rule.keywords.every(k => url.includes(k))) {
            return rule.icon;
        }
    }

    // 2. CUSTOM OVERRIDES
    for (const [domain, iconUrl] of Object.entries(WEBSITE_ICONS)) {
        if (hostname.includes(domain)) {
            return iconUrl;
        }
    }
    return `https://favicon.pub/${hostname}`;
    // 3. DEFAULT GOOGLE S2 FALLBACK
}
const FAVICON_RULES = [
    //
    // GOOGLE PRODUCT: MAPS
    //
    {
        keywords: ["google", "map"],
        icon: "https://www.google.com/images/branding/product/ico/maps15_bnuw3a_64dp.ico"
    },

    //
    // GOOGLE PRODUCT: GMAIL
    //
    {
        keywords: ["google", "mail"],
        icon: "https://ssl.gstatic.com/ui/v1/icons/mail/rfr/gmail.ico"
    },
    {
        keywords: ["google", "gmail"],
        icon: "https://ssl.gstatic.com/ui/v1/icons/mail/rfr/gmail.ico"
    },

    //
    // GOOGLE PRODUCT: DOCUMENTS
    //
    {
        keywords: ["google", "docs"],
        icon: "https://ssl.gstatic.com/docs/doclist/images/mediatype/icon_1_document_x64.png"
    },
    {
        keywords: ["google", "document"],
        icon: "https://ssl.gstatic.com/docs/doclist/images/mediatype/icon_1_document_x64.png"
    },

    //
    // GOOGLE PRODUCT: SPREADSHEETS
    //
    {
        keywords: ["google", "sheet"],
        icon: "https://ssl.gstatic.com/docs/doclist/images/mediatype/icon_1_spreadsheet_x64.png"
    },
    {
        keywords: ["google", "sheets"],
        icon: "https://ssl.gstatic.com/docs/doclist/images/mediatype/icon_1_spreadsheet_x64.png"
    },

    //
    // GOOGLE PRODUCT: FORMS
    //
    {
        keywords: ["google", "form"],
        icon: "https://ssl.gstatic.com/docs/doclist/images/mediatype/icon_2_form_x64.png"
    },

    //
    // GOOGLE PRODUCT: DRAWINGS
    //
    {
        keywords: ["google", "drawing"],
        icon: "https://ssl.gstatic.com/docs/doclist/images/mediatype/icon_1_drawing_x64.png"
    },
    {
        keywords: ["google", "draw"],
        icon: "https://ssl.gstatic.com/docs/doclist/images/mediatype/icon_1_drawing_x64.png"
    },

    //
    // GOOGLE PRODUCT: SLIDES / PRESENTATIONS
    //
    {
        keywords: ["google", "slide"],
        icon: "https://ssl.gstatic.com/docs/doclist/images/mediatype/icon_1_presentation_x64.png"
    },
    {
        keywords: ["google", "presentation"],
        icon: "https://ssl.gstatic.com/docs/doclist/images/mediatype/icon_1_presentation_x64.png"
    },

    //
    // GOOGLE PRODUCT: DRIVE FOLDERS
    //
    {
        keywords: ["google", "folder"],
        icon: "https://ssl.gstatic.com/docs/doclist/images/mediatype/icon_1_folder_x64.png"
    },

    //
    // GOOGLE PRODUCT: KEEP
    //
    {
        keywords: ["google", "keep"],
        icon: "https://ssl.gstatic.com/gb/images/a/911e3628e6.png"
    },

    //
    // FILE FORMATS (Word, Excel, PowerPoint, PDF)
    //
    {
        keywords: ["google", "word"],
        icon: "https://ssl.gstatic.com/docs/doclist/images/mediatype/icon_1_word_x64.png"
    },
    {
        keywords: ["google", "excel"],
        icon: "https://ssl.gstatic.com/docs/doclist/images/mediatype/icon_1_excel_x64.png"
    },
    {
        keywords: ["google", "powerpoint"],
        icon: "https://ssl.gstatic.com/docs/doclist/images/mediatype/icon_1_powerpoint_x64.png"
    },
    {
        keywords: ["google", "pdf"],
        icon: "https://ssl.gstatic.com/docs/doclist/images/mediatype/icon_3_pdf_x64.png"
    },

    //
    // DEFAULT GOOGLE FALLBACK
    //
    {
        keywords: ["google"],
        icon: "https://www.google.com/favicon.ico"
    }
];


const WEBSITE_ICONS = {
    "google.com": "https://www.google.com/favicon.ico",
    "gmail.com": "https://ssl.gstatic.com/ui/v1/icons/mail/rfr/gmail.ico",
    "mail.google.com": "https://ssl.gstatic.com/ui/v1/icons/mail/rfr/gmail.ico",
    "maps.google.com": "https://maps.gstatic.com/favicon3.ico",
    "youtube.com": "https://s.ytimg.com/yts/img/favicon_32-vflOogEID.png",
    "facebook.com": "https://static.xx.fbcdn.net/rsrc.php/yo/r/UlIqmHJn-SK.ico",
    "instagram.com": "https://www.instagram.com/static/images/ico/favicon-192.png/68d99ba29cc8.png",
    "twitter.com": "https://abs.twimg.com/favicons/twitter.ico",
    "x.com": "https://abs.twimg.com/favicons/twitter.ico",
    "reddit.com": "https://www.redditstatic.com/desktop2x/img/favicon/favicon-32x32.png",
    "amazon.com": "https://www.amazon.com/favicon.ico",
    "amazon.co.uk": "https://www.amazon.co.uk/favicon.ico",
    "linkedin.com": "https://static.licdn.com/scds/common/u/images/logos/favicons/v1/favicon.ico",
};
// ---------------------------------------------------------
// 5. Bookmarks list
// ---------------------------------------------------------

// function renderBookmarks() {
//     const root = document.getElementById("bookmarks");
//     root.innerHTML = ""; // Clear existing bookmarks

//     chrome.bookmarks.getTree((tree) => {
//         function makeList(nodes, parent) {
//             nodes.forEach((node) => {
//                 // Skip the root node
//                 if (!node.children) return;

//                 node.children.forEach((childNode) => {
//                     // Skip "Other bookmarks" and "Mobile bookmarks" folders
//                     if (childNode.title === "Other bookmarks" || childNode.title === "Mobile bookmarks") {
//                         return;
//                     }

//                     const li = document.createElement("li");

//                     if (childNode.url) {
//                         // It's a bookmark link
//                         const link = document.createElement("a");
//                         link.href = childNode.url;
//                         link.target = "_blank";
//                         link.title = childNode.title || childNode.url;

//                         // Create icon element
//                         const iconDiv = document.createElement("div");
//                         iconDiv.className = "bookmark-icon";
//                         const faviconUrl = `https://www.google.com/s2/favicons?sz=64&domain=${new URL(childNode.url).hostname}`;
//                         iconDiv.style.backgroundImage = `url('${faviconUrl}')`;
//                         link.appendChild(iconDiv);

//                         // Create label element
//                         const labelDiv = document.createElement("div");
//                         labelDiv.className = "bookmark-label";
//                         labelDiv.textContent = childNode.title || "Untitled";
//                         link.appendChild(labelDiv);

//                         li.appendChild(link);
//                     } else {
//                         // It's a folder
//                         li.className = "bookmark-folder";

//                         const folderTitle = document.createElement("div");
//                         folderTitle.className = "bookmark-folder-title";
//                         folderTitle.style.position = "relative";

//                         const folderIcon = document.createElement("div");
//                         folderIcon.className = "bookmark-folder-icon";
//                         folderIcon.textContent = "";
//                         folderTitle.appendChild(folderIcon);

//                         const folderName = document.createElement("div");
//                         folderName.style.fontWeight = "600";
//                         folderName.textContent = childNode.title || "Folder";
//                         folderTitle.appendChild(folderName);

//                         li.appendChild(folderTitle);

//                         // Create folder items list
//                         if (childNode.children && childNode.children.length > 0) {
//                             const folderUl = document.createElement("ul");
//                             folderUl.className = "bookmark-folder-items";

//                             childNode.children.forEach((item) => {
//                                 const itemLi = document.createElement("li");
//                                 if (item.url) {
//                                     const link = document.createElement("a");
//                                     link.href = item.url;
//                                     link.target = "_blank";
//                                     link.title = item.title || item.url;

//                                     // Create icon element
//                                     const iconDiv = document.createElement("div");
//                                     iconDiv.className = "bookmark-icon";
//                                     const faviconUrl = `https://www.google.com/s2/favicons?sz=64&domain=${new URL(item.url).hostname}`;
//                                     iconDiv.style.backgroundImage = `url('${faviconUrl}')`;
//                                     link.appendChild(iconDiv);

//                                     // Create label element
//                                     const labelDiv = document.createElement("div");
//                                     labelDiv.className = "bookmark-label";
//                                     labelDiv.textContent = item.title || "Untitled";
//                                     link.appendChild(labelDiv);

//                                     itemLi.appendChild(link);
//                                 } else if (item.children && item.children.length > 0) {
//                                     // It's a nested folder - make it clickable
//                                     const folderLink = document.createElement("a");
//                                     folderLink.href = "#";
//                                     folderLink.style.textDecoration = "none";
//                                     folderLink.style.cursor = "pointer";

//                                     // Create folder icon
//                                     const folderIconDiv = document.createElement("div");
//                                     folderIconDiv.className = "bookmark-icon";
//                                     folderIconDiv.innerHTML = "&#128193;";
//                                     folderIconDiv.style.fontSize = "24px";
//                                     folderIconDiv.style.backgroundColor = "#fff9f0";
//                                     folderLink.appendChild(folderIconDiv);

//                                     // Create label
//                                     const labelDiv = document.createElement("div");
//                                     labelDiv.className = "bookmark-label";
//                                     labelDiv.textContent = item.title || "Folder";
//                                     folderLink.appendChild(labelDiv);

//                                     // Click handler to show folder contents
//                                     folderLink.addEventListener("click", (e) => {
//                                         e.preventDefault();
//                                         showFolderContents(item.title, item.children);
//                                     });

//                                     itemLi.appendChild(folderLink);
//                                 } else {
//                                     // Nested folder with no items
//                                     itemLi.textContent = item.title || "Folder";
//                                 }
//                                 folderUl.appendChild(itemLi);
//                             });

//                             li.appendChild(folderUl);

//                             // Check if this is the "Bookmarks bar" - keep it always open
//                             const isBookmarksBar = childNode.title === "Bookmarks bar";

//                             // Hide the folder title for Bookmarks bar
//                             if (isBookmarksBar) {
//                                 folderTitle.style.display = "none";
//                                 folderUl.classList.add("bookmarks-bar-items");
//                             }

//                             // Only add toggle if not Bookmarks bar
//                             if (!isBookmarksBar) {
//                                 // Add click handler for toggle
//                                 const toggle = document.createElement("span");
//                                 toggle.className = "bookmark-folder-toggle";
//                                 toggle.textContent = "▼";
//                                 toggle.style.cursor = "pointer";

//                                 folderTitle.appendChild(toggle);
//                                 folderTitle.style.cursor = "pointer";

//                                 folderTitle.addEventListener("click", (e) => {
//                                     e.preventDefault();
//                                     folderUl.classList.toggle("collapsed");
//                                     toggle.classList.toggle("collapsed");
//                                 });
//                             } else {
//                                 // Bookmarks bar is not clickable, doesn't collapse
//                                 folderTitle.style.cursor = "default";
//                             }
//                         }
//                     }

//                     parent.appendChild(li);
//                 });
//             });
//         }

//         makeList(tree, root);
//     });
// }

// Function to display folder contents in a modal/overlay
function showFolderContents(folderName, items) {
    // Remove existing modal if present
    const existingModal = document.getElementById("folder-modal");
    if (existingModal) existingModal.remove();

    // Create modal
    const modal = document.createElement("div");
    modal.id = "folder-modal";
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
    `;

    // Create modal content
    const modalContent = document.createElement("div");
    modalContent.style.cssText = `
        background: white;
        border-radius: 12px;
        padding: 20px;
        max-width: 600px;
        max-height: 70vh;
        width: 90%;
        box-shadow: 0 4px 20px rgba(0,0,0,0.2);
        display: flex;
        flex-direction: column;
    `;

    // Title
    const title = document.createElement("h2");
    title.textContent = folderName;
    title.style.cssText = "margin: 0 0 16px 0; color: #4b5437; font-size: 1.3em;";
    modalContent.appendChild(title);

    // Close button
    const closeBtn = document.createElement("button");
    closeBtn.textContent = "x";
    closeBtn.style.cssText = `
        position: absolute;
        top: 12px;
        right: 12px;
        background: none;
        border: none;
        font-size: 24px;
        cursor: pointer;
        color: #999;
    `;
    closeBtn.addEventListener("click", () => modal.remove());
    modalContent.appendChild(closeBtn);

    // Items container with grid
    const itemsContainer = document.createElement("div");
    itemsContainer.style.cssText = `
        display: grid;
        grid-template-columns: repeat(5, 1fr);
        gap: 12px;
        overflow-y: auto;
        padding-right: 8px;
    `;

    items.forEach((item) => {
        if (item.url) {
            const link = document.createElement("a");
            link.href = item.url;
            link.target = "_blank";
            link.style.cssText = `
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 8px;
                text-decoration: none;
                color: #4b5437;
                padding: 8px;
                border-radius: 8px;
                transition: all 0.2s;
                text-align: center;
            `;

            // Icon
            const iconDiv = document.createElement("div");
            iconDiv.style.cssText = `
                width: 38px;
                height: 38px;
                border-radius: 6px;
                background-size: contain;
                background-repeat: no-repeat;
                background-position: center;
                background-color: #f5f5f5;
                border: 1px solid #e0e0e0;
                display: flex;
                align-items: center;
                justify-content: center;
            `;
            const faviconUrl = `https://www.google.com/s2/favicons?sz=64&domain=${new URL(item.url).hostname}`;
            iconDiv.style.backgroundImage = `url('${faviconUrl}')`;
            link.appendChild(iconDiv);

            // Label
            const labelDiv = document.createElement("div");
            labelDiv.style.cssText = `
                font-weight: 500;
                font-size: 0.85vw;
                display: -webkit-box;
                -webkit-line-clamp: 2;
                line-clamp: 2;
                -webkit-box-orient: vertical;
                overflow: hidden;
                max-width: 100%;
            `;
            labelDiv.textContent = item.title || "Untitled";
            link.appendChild(labelDiv);

            link.addEventListener("mouseenter", () => {
                link.style.backgroundColor = "#f0ede9";
                link.style.transform = "translateY(-2px)";
            });
            link.addEventListener("mouseleave", () => {
                link.style.backgroundColor = "transparent";
                link.style.transform = "translateY(0)";
            });

            itemsContainer.appendChild(link);
        }
    });

    modalContent.appendChild(itemsContainer);
    modal.appendChild(modalContent);
    document.body.appendChild(modal);

    // Close modal on background click
    modal.addEventListener("click", (e) => {
        if (e.target === modal) modal.remove();
    });
}

// Get and display most visited sites from Chrome history
function renderTopSites(sites) {
    if (!sites || sites.length === 0) return;
    console.log(sites);
    const root = document.getElementById("bookmarks");

    const li = document.createElement("li");
    li.className = "bookmark-folder";

    const folderUl = document.createElement("ul");
    folderUl.className = "bookmark-folder-items";

    sites.slice(0, 12).forEach((site) => {
        const itemLi = document.createElement("li");
        const link = document.createElement("a");
        link.href = site.url;
        link.target = "_blank";
        link.title = site.title || site.url;

        const iconDiv = document.createElement("div");
        iconDiv.className = "bookmark-icon";
        const hostname = new URL(site.url).hostname;

        const iconUrl = getIconForDomain(site.url);
        iconDiv.style.backgroundImage = `url('${iconUrl}')`;

        link.appendChild(iconDiv);

        const labelDiv = document.createElement("div");
        labelDiv.className = "bookmark-label";
        labelDiv.textContent = site.title || hostname;
        link.appendChild(labelDiv);

        itemLi.appendChild(link);
        folderUl.appendChild(itemLi);
    });

    li.appendChild(folderUl);
    root.appendChild(li);
}


document.addEventListener('DOMContentLoaded', function () {
    //renderBookmarks();
    chrome.topSites.get().then(renderTopSites);
});
