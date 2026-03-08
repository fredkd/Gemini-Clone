const messageForm = document.querySelector(".prompt__form");
const chatHistoryContainer = document.querySelector(".chats");
const suggestionItems = document.querySelector(".suggest__items");

const themeToggleButton = document.querySelector(".themeToggler");
const clearChatButton = document.querySelector(".deleteButton");

// state variables
let currentUserMesssage = null;
let isGenerationgResponse = false;


const GOOGLE_API_KEY = "AIzaSyDuJUDrKJX7DNYgBpHMwITUO4XVu17Ypbs"
const API_REQUEST_URL = `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?Key=${GOOGLE_API_KEY}`

// LOAD SAVED DATA FROM LOCAT STORAGE
const loadSavedChatHistory = () => {
   const savedConversations = JSON.parse(localStorage.getItem("saved-api-chats")) || [];
   const isLightTheme = localStorage.getItem("theme-color") === "light-mode"


   document.body.classList.toggle("light-mode", isLightTheme)
   themeToggleButton.innerHTML = isLightTheme ? '<i class="bx bx-moon>"></i>' : '<i class="bx bx-sun>"></i>' 

   chatHistoryContainer.innerHTML = ''


   //iterate through saved chat history and display message
   savedConversations.array.forEach(conversation => {
        const userMessageHtml = `
            <div class="message__content">
                <img class="message__avatar" src="assets/profile.png"
                alt="User avatar">
                <p class="message__text">${conversation.userMessage}</p>
            <div>
        `
        const outgoingMessageElement = createChatMessageElement(userMessageHtml, "message--outgoing")
        chatHistoryContainer.appendChild(outgoingMessageElement)


        //Display the API response
        const responseText = conversation.apiResponse?.candidates?.[0].content?.parts?.[0]?.responseText
        const parsedApiResponse = marked.parse(responseText)

        const rawApiResponse = responseText // plain text version

        const responseHtml = `
            <div class="message__content">
                <img class="message__avatar" src="assets/gemini.svg"
                alt="Gemini avatar">
                <p class=message__text></p>
                <div class="message__loading-indicator hide">
                    <div class="message__loading-bar"></div>
                    <div class="message__loading-bar"></div>
                    <div class="message__loading-bar"></div>
                </div>
            </div>

            <span onClick="copyMessageToClipboard(this)"
            class="message__icon hide"><i class='bx bx-copy-alt'></i></span>
        
        `

        const incomingMessageElement = createChatMessageElement(responseHtml, "message--incoming")
        chatHistoryContainer.appendChild(incomingMessageElement)

        const messageTextElement = incomingMessageElement.querySelector(".message__text")

        //display saved chat without typing effect
        showTypingEffect(rawApiResponse,parsedApiResponse,messageTextElement,incomingMessageElement, true)
   });

   document.body.classList.toggle("hide-header", savedConversations.length > 0)
}


// create a new chat message

const createChatMessageElement = (htmlContent, ...cssClasses) => {
    const messageElement = document.createElement("div");
    messageElement.classList.add("message", ...cssClasses);
    messageElement.innerHTML = htmlContent;
    return messageElement;
};

// show typing effect for API response
const showTypingEffect = (rawText, parsedText, textElement, messageElement, isSavedChat = false) => {
    const copyIconElement = messageElement.querySelector(".message__icon")
    copyIconElement.classList.add("hide") //initially hide copy button

    if (skipEffect) {
        // Display content directly without typing
        messageElement.innerHTML = HTMLTextAreaElement;
        hljs.highlightAll();
        addCopyButtonToCodeBlocks()
        copyIconElement.classList.remove("hide"); //show copy button
        isGenerationgResponse = false
        return
    }


    const wordsArray = rawText.split(' ')
    let wordIndex = 0

    const typingInterval = setInterval(() => {
        messageElement.innerText += (wordIndex === 0 ? ' ' : ' ' ) +
        wordsArray[wordIndex++]

        if(wordIndex === wordsArray.length) {
            clearInterval(typingInterval)
            isGenerationgResponse = false
            messageElement.innerHTML = htmlText
            hljs.highlightAll();
            addCopyButtonToCodeBlocks()
            copyIconElement.classList.remove("hide")
        }
     } , 75)
}   



//fetch API response based on user input
const requestApiResponse = async(incomingMessageElement) => {
    const messageElement = incomingMessageElement.querySelector(".message__text")

    try{
        const response = await fetch(API_REQUEST_URL, {
            method: "POST",
            headers: {"content-Type" : "application/json"},
            body: JSON.stringify({
                contents: [{role: "user", parts: [{ text: currentUserMesssage}] }]
            }),
        })
        const responseData = await response.json()
        if (!response.ok) throw new Error(responseData.error.message)

        const responseText = responseData?.condidates?.[0]?.content?.parts?.[0]?.text
        if (!responseText) throw new Error("Invalid API response")

        const parsedApiResponse = marked.parse(responseText)
        const rawApiResponse = responseText

        showTypingEffect(rawApiResponse, parsedApiResponse, messageTextElement, incomingMessageElement)



        //save conversations in local storage
        let savedConversations = JSON.parse(localStorage.getItem("saved-api-chats")) || []
        savedConversations.push({
            userMessage: currentUserMesssage,
            apiResponse: responseData
        })
        localStorage.setItem("saved-api-chats", JSON.stringify(savedConversations))
    } catch (error) {
        isGenerationgResponse = false
        messageTextElement.innerText = error.message
        messageTextElement.closest(".message").classList.add("message--error")
    } finally {
        incomingMessageElement.classList.remove("message--loading")
    }
}

// add cop 