const promptInput = document.getElementById("prompt");
const chats = document.querySelector(".chats");
const sendBtn = document.getElementById("send-btn");
const attachBtn = document.getElementById("attach-btn");
const fileInput = document.getElementById("file-input");
const themeBtn = document.getElementById("theme-btn");
const deleteBtn = document.getElementById("delete-btn");

const header = document.querySelector(".app-header");
const suggestions = document.querySelector(".suggestions");

/* GEMINI API */
const API_KEY = "Enter your KEY Here";
const API_URL =
`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`;

let history = [];
const MAX_HISTORY = 4;

/* HELPERS */
function hideIntro(){
    header.classList.add("hide");
    suggestions.classList.add("hide");
}

function addUserMessage(html){
    const div = document.createElement("div");
    div.className = "message user";
    div.innerHTML = html;
    chats.appendChild(div);
    chats.scrollTop = chats.scrollHeight;
}

function addBotMessage(){
    const div = document.createElement("div");
    div.className = "message bot bot-thinking";
    div.innerHTML = `
        <img src="gemini-chatbot-logo.svg" class="bot-logo">
        <div class="bot-bubble">Thinking...</div>
    `;
    chats.appendChild(div);
    chats.scrollTop = chats.scrollHeight;
    return div;
}

function formatResponse(text){
    return text.replace(/\n{2,}/g, "\n\n");
}

/*SUGGESTIONS */
document.querySelectorAll(".suggestions li").forEach(item=>{
    item.onclick = ()=>{
        promptInput.value = item.dataset.text;
        sendMessage();
    };
});

/*SEND MESSAGE */
async function sendMessage(){
    const text = promptInput.value.trim();
    if(!text) return;

    hideIntro();
    addUserMessage(text);
    promptInput.value = "";

    const botDiv = addBotMessage();

    // rate-limit safety
    sendBtn.disabled = true;
    setTimeout(()=> sendBtn.disabled = false, 3000);

    history.push({ role:"user", parts:[{ text }] });
    const limitedHistory = history.slice(-MAX_HISTORY);

    /* TRY REAL GEMINI API */
    try{
        const res = await fetch(API_URL,{
            method:"POST",
            headers:{ "Content-Type":"application/json" },
            body: JSON.stringify({ contents: limitedHistory })
        });

        if(!res.ok) throw new Error(res.status);

        const data = await res.json();

        botDiv.classList.remove("bot-thinking");
        botDiv.querySelector(".bot-bubble").textContent =
            formatResponse(
                data.candidates[0].content.parts[0].text
            );

    }catch(err){
        /* AUTO FALLBACK (MOCK MODE) */
        console.warn("Gemini API failed:", err.message);

        botDiv.classList.remove("bot-thinking");
        botDiv.querySelector(".bot-bubble").textContent =
`⚠️ Gemini API unavailable

Reason:
• Browser restriction
• 400 / 429 error
• Free tier limit

Your question:
"${text}"

This is a fallback demo response.
For real AI output, use Node.js backend.`;
    }
}

/* FILE ATTACH  */
attachBtn.onclick = ()=> fileInput.click();

fileInput.onchange = ()=>{
    const file = fileInput.files[0];
    if(!file) return;

    hideIntro();

    const imgURL = URL.createObjectURL(file);
    addUserMessage(`
        <img src="${imgURL}" class="chat-image">
        <div>Analyze this image</div>
    `);

    promptInput.value = "Analyze this image";
    sendMessage();
    fileInput.value = "";
};

/*  THEME */
themeBtn.onclick = ()=>{
    document.body.classList.toggle("light");
    themeBtn.textContent =
        document.body.classList.contains("light")
        ? "dark_mode" : "light_mode";
};

/* DELETE CHAT*/
deleteBtn.onclick = ()=>{
    chats.innerHTML="";
    history.length = 0;
    header.classList.remove("hide");
    suggestions.classList.remove("hide");
};

/* EVENTS */
sendBtn.onclick = sendMessage;
promptInput.addEventListener("keydown", e=>{
    if(e.key === "Enter") sendMessage();
});

