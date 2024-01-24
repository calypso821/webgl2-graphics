document.addEventListener("DOMContentLoaded", function () {
    const startScreen = document.getElementById("start-screen");
    const helpScreen = document.getElementById("help-screen");
    const startButton = document.getElementById("start-button");
    const optionsButton = document.getElementById("options-button");
    const helpButton = document.getElementById("help-button");

    // Define helpContainer outside of the event listener
    const helpContainer = document.getElementById("help-container");

    // Start button click event
    startButton.addEventListener("click", function () {
        startScreen.style.display = "none"; // Hide start screen
        // Additional logic for starting the game can be added here

        // Navigate to src/index.html
        window.location.href = "src/index.html";
    });

    // Options button click event
    optionsButton.addEventListener("click", function () {
        alert("Options button clicked!");
        // Add logic to show options screen
    });

    // Help button click event
    helpButton.addEventListener("click", function () {
        startScreen.style.display = "none";
        helpScreen.style.display = "block";

        // Create a paragraph element for the help text
        const helpTextElement = document.createElement("p");
        helpTextElement.textContent = "This is some helpful information about your game.";

        // Append the paragraph element to the help container
        helpContainer.appendChild(helpTextElement);
    });

    // Back to Main button click event
    document.getElementById("back-to-main-button").addEventListener("click", function () {
        startScreen.style.display = "block";
        helpScreen.style.display = "none";

        // Clear the help container content when going back to the main screen
        helpContainer.innerHTML = "";
    });
});
