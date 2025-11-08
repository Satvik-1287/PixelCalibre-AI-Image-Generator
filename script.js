const promptForm = document.querySelector(".prompt-form");
const themeToggle = document.querySelector(".theme-toggle");
const promptBtn = document.querySelector(".prompt-btn");
const promptInput = document.querySelector(".prompt-input");
const generateBtn = document.querySelector(".generate-btn");
const galleryGrid = document.querySelector(".gallery-grid");
const countSelect = document.getElementById("count-select");
const ratioSelect = document.getElementById("ratio-select");

// Example prompts
const examplePrompts = [
  "A magic forest with glowing plants and fairy homes among giant mushrooms",
  "A futuristic city skyline at sunset with flying cars",
  "A cyberpunk street full of neon lights and rain reflections",
  "A dragon sleeping on gold coins in a crystal cave",
  "An astronaut walking on an alien planet with purple skies",
];

// === THEME ===
(() => {
  const savedTheme = localStorage.getItem("theme");
  const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const isDark = savedTheme === "dark" || (!savedTheme && systemPrefersDark);
  document.body.classList.toggle("dark-theme", isDark);
  themeToggle.querySelector("i").className = isDark ? "fa-solid fa-sun" : "fa-solid fa-moon";
})();
const toggleTheme = () => {
  const isDark = document.body.classList.toggle("dark-theme");
  localStorage.setItem("theme", isDark ? "dark" : "light");
  themeToggle.querySelector("i").className = isDark ? "fa-solid fa-sun" : "fa-solid fa-moon";
};

// === DIMENSIONS ===
const getImageDimensions = (aspectRatio, baseSize = 4096) => {
  const [w, h] = aspectRatio.split("/").map(Number);
  const scale = baseSize / Math.max(w, h);
  return { width: Math.round(w * scale), height: Math.round(h * scale) };
};

// === GENERATE POLLINATIONS URL ===
const generatePollinationsURL = (prompt, seed, width, height) => {
  const cleanPrompt = encodeURIComponent(prompt.trim());
  return `https://image.pollinations.ai/prompt/${cleanPrompt}?seed=${seed}&width=${width}&height=${height}&nologo=true&enhance=true`;
};

// === UPDATE CARD WITH IMAGE ===
const updateImageCard = (index, imageUrl) => {
  const imgCard = document.getElementById(`img-card-${index}`);
  imgCard.classList.remove("loading");
  imgCard.innerHTML = `
    <img class="result-img" src="${imageUrl}" alt="AI Generated Image"/>
    <div class="img-overlay">
      <button class="img-download-btn" title="Download Image" onclick="downloadImage('${imageUrl}', promptInput.value)">
        <i class="fa-solid fa-download"></i>
      </button>
    </div>
  `;
};

// === GENERATE IMAGES ===
const generateImages = (imageCount, aspectRatio, promptText) => {
  const { width, height } = getImageDimensions(aspectRatio);
  generateBtn.disabled = true;

  const loadImage = (index, retries = 3) => {
    const imgCard = document.getElementById(`img-card-${index}`);
    const seed = Math.floor(Math.random() * 9999999);
    const imgUrl = generatePollinationsURL(promptText, seed, width, height);
    const img = new Image();

    img.onload = () => updateImageCard(index, imgUrl);

    img.onerror = () => {
      if (retries > 0) {
        console.warn(`Retrying image ${index + 1} (${3 - retries + 1}/3)...`);
        setTimeout(() => loadImage(index, retries - 1), 500); // retry after 0.5s
      } else {
        imgCard.classList.replace("loading", "error");
        imgCard.querySelector(".status-text").textContent = "Failed to load image!";
      }
    };

    img.src = imgUrl;
  };

  for (let i = 0; i < imageCount; i++) {
    loadImage(i);
  }

  setTimeout(() => (generateBtn.disabled = false), 1500);
};


// === CREATE IMAGE CARDS ===
const createImageCards = (imageCount, aspectRatio, promptText) => {
  galleryGrid.innerHTML = "";
  for (let i = 0; i < imageCount; i++) {
    galleryGrid.innerHTML += `
      <div class="img-card loading" id="img-card-${i}" style="aspect-ratio:${aspectRatio}">
        <div class="status-container">
          <div class="spinner"></div>
          <i class="fa-solid fa-triangle-exclamation"></i>
          <p class="status-text">Generating...</p>
        </div>
      </div>`;
  }
  document.querySelectorAll(".img-card").forEach((card, i) => {
    setTimeout(() => card.classList.add("animate-in"), 100 * i);
  });
  generateImages(imageCount, aspectRatio, promptText);
};

// === FORM SUBMIT ===
const handleFormSubmit = (e) => {
  e.preventDefault();
  const imageCount = parseInt(countSelect.value) || 1;
  const aspectRatio = ratioSelect.value || "1/1";
  const promptText = promptInput.value.trim() || "A futuristic city skyline at sunset";
  createImageCards(imageCount, aspectRatio, promptText);
};

// === RANDOM PROMPT BUTTON ===
promptBtn.addEventListener("click", () => {
  const prompt = examplePrompts[Math.floor(Math.random() * examplePrompts.length)];
  promptInput.value = "";
  promptInput.focus();
  let i = 0;
  promptBtn.disabled = true;
  const typing = setInterval(() => {
    if (i < prompt.length) {
      promptInput.value += prompt.charAt(i++);
    } else {
      clearInterval(typing);
      promptBtn.disabled = false;
    }
  }, 10);
});

// === EVENTS ===
themeToggle.addEventListener("click", toggleTheme);
promptForm.addEventListener("submit", handleFormSubmit);

// === DOWNLOAD ===
const downloadImage = async (imgUrl, promptText) => {
  try {
    // Sanitize prompt for file naming
    const safePrompt = promptText
      .replace(/[^\w\s-]/g, "")   // Remove special chars
      .replace(/\s+/g, "_")       // Replace spaces with underscores
      .slice(0, 40) || "image";   // Limit length, fallback name

    const response = await fetch(imgUrl);
    const blob = await response.blob();

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${safePrompt}.jpg`;
    document.body.appendChild(link);
    link.click();

    // Cleanup
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  } catch (error) {
    console.error("Download failed:", error);
    alert("⚠️ Failed to download image. Please try again.");
  }
};
