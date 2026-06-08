const SUPABASE_URL =
"https://bgetgbvfxbljucqxtper.supabase.co";

const SUPABASE_KEY =
"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJnZXRnYnZmeGJsanVjcXh0cGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA4NzEwODIsImV4cCI6MjA5NjQ0NzA4Mn0.C0R7-nj62y9dE5c4SYrjyjiVUIUGm6-Ensw1fsh5pbU";

const supabaseClient =
window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

// ======================
// ELEMENTS
// ======================

const adminBtn =
document.querySelector(".admin-btn");

const adminPage =
document.querySelector("admin");

const loginPage = document.querySelector("login");
const gameoverPage = document.querySelector("gameover");
const mainPage = document.querySelector("main");

const nameInput = document.querySelector(".name-input");
const startBtn = document.querySelector(".start-btn");

const playerName = document.querySelector(".name");
const balanceText = document.querySelector(".balance");

const betsText = document.querySelector(".bets");
const winsText = document.querySelector(".wins");
const profitText = document.querySelector(".profit");

const timerText = document.querySelector(".timer");

const roulette = document.querySelector(".roulette");

const redBtn = document.querySelector(".red-btn");
const blackBtn = document.querySelector(".black-btn");

const leaveBtn = document.querySelector(".leave-btn");

const redBall = document.querySelector(".red-ball");
const blackBall = document.querySelector(".black-ball");
const resultText = document.querySelector(".result-text");

// ======================
// GAME VARIABLES
// ======================

let balance = 1000;
let bets = 0;
let wins = 0;
let profit = 0;

let gameActive = false;
let timeLeft = 90; // 3 minutes

// ======================
// INITIAL STATE
// ======================

mainPage.style.display = "none";
gameoverPage.style.display = "none";

// ======================
// UPDATE UI
// ======================

async function saveResult() {

    const { error } =
    await supabaseClient
    .from("results")
    .upsert({
        name: playerName.textContent,
        balance: balance,
        profit: profit,
        bets: bets,
        wins: wins
    });

    if(error){
        console.error(error);
    }
}

async function loadResults(){

    const { data, error } =
    await supabaseClient
    .from("results")
    .select("*");

    if(error){
        console.error(error);
        return;
    }

    renderTable(data);
}

function updateUI() {
    balanceText.textContent = `$${balance}`;

    betsText.textContent = `${bets} bets`;

    winsText.textContent = `${wins} wins`;

    if (profit >= 0) {
        profitText.textContent = `+$${profit}`;
        profitText.style.color = "#00ff00"; // green
    } else {
        profitText.textContent = `-$${Math.abs(profit)}`;
        profitText.style.color = "#ff4444"; // red
    }
}

function renderTable(players){

    const body =
    document.getElementById("resultsBody");

    body.innerHTML = "";

    players.forEach(player => {

        body.innerHTML += `
        <tr>
            <td>${player.name}</td>
            <td>$${player.balance}</td>
            <td style="
                color:${player.profit >= 0
                    ? '#00ff00'
                    : '#ff4444'}
            ">
                ${player.profit}
            </td>
            <td>${player.bets}</td>
            <td>${player.wins}</td>
        </tr>
        `;
    });

    updateStats(players);
}

function updateStats(players){

    const totalPlayers =
    players.length;

    const totalBets =
    players.reduce(
        (sum,p) => sum + p.bets,
        0
    );

    const classLosses =
    players.reduce(
        (sum,p) => sum + (1000 - p.balance),
        0
    );

    const averageBalance =
    totalPlayers
    ? Math.round(
        players.reduce(
            (sum,p)=>sum+p.balance,
            0
        ) / totalPlayers
      )
    : 0;

    document.querySelector(
        ".stat-players .stat-value"
    ).textContent =
        totalPlayers;

    document.querySelector(
        ".stat-total-bets .stat-value"
    ).textContent =
        totalBets;

    document.querySelector(
        ".stat-class-losses .stat-value"
    ).textContent =
        "$" + classLosses;

    document.querySelector(
        ".stat-average-balance .stat-value"
    ).textContent =
        "$" + averageBalance;
}

adminBtn.addEventListener("click", () => {

    loginPage.style.display = "none";
    mainPage.style.display = "none";
    gameoverPage.style.display = "none";

    adminPage.style.display = "flex";

    loadResults();

});


// ======================
// TIMER
// ======================

function startTimer() {

    const timer = setInterval(async () => {

        if (!gameActive) {
            clearInterval(timer);
            return;
        }

        timeLeft--;

        let minutes = Math.floor(timeLeft / 60);
        let seconds = timeLeft % 60;

        timerText.textContent =
            `time left: ${minutes}:${seconds.toString().padStart(2, "0")}`;

        if (timeLeft <= 0) {

            clearInterval(timer);

            gameActive = false;

            redBtn.disabled = true;
            blackBtn.disabled = true;

            await saveResult();
            gameoverPage.style.display = "block";
            mainPage.style.display = "none";
            adminPage.style.display = "none";
            loginPage.style.display = "none";

            alert(
                `Time is up!\n\nBalance: $${balance}\nProfit: $${profit}`
            );
        }

    }, 1000);
}

// ======================
// LOGIN
// ======================

startBtn.addEventListener("click", () => {

    const enteredName = nameInput.value.trim();

    if (!enteredName) {
        alert("Enter your name first.");
        return;
    }

    playerName.textContent = enteredName;

    loginPage.style.display = "none";
    mainPage.style.display = "block";

    gameActive = true;

    updateUI();
    startTimer();
});

// ======================
// SPIN FUNCTION
// ======================

function spin(playerChoice){

    if(redBtn.disabled || blackBtn.disabled) return;

    if(!gameActive) return;

    if(balance < 100){
        alert("Not enough money.");
        return;
    }

    redBtn.disabled = true;
    blackBtn.disabled = true;

    bets++;

    updateUI();

    resultText.textContent = "";

    redBall.style.display = "block";
    blackBall.style.display = "block";

    redBall.classList.add("bouncing");
    blackBall.classList.add("bouncing");

    const win = Math.random() < 0.30;

    let resultColor;

    if(win){

        resultColor = playerChoice;

        balance += 200;

        wins++;

        profit += 100;

    }else{

        resultColor =
            playerChoice === "red"
            ? "black"
            : "red";

        profit -= 100;
    }

    setTimeout(() => {

        redBall.classList.remove("bouncing");
        blackBall.classList.remove("bouncing");

        if(resultColor === "red"){

            blackBall.style.display = "none";

        }else{

            redBall.style.display = "none";
        }

        balance -= 100;

        if(win){

            resultText.textContent =
                "YOU WON $100";

            resultText.style.color =
                "#00ff00";

        }else{

            resultText.textContent =
                "YOU LOST $100";

            resultText.style.color =
                "#ff4444";
        }

        updateUI();

        redBtn.disabled = false;
        blackBtn.disabled = false;

        if(balance <= 0){

            saveResult();
            gameoverPage.style.display = "block";
            mainPage.style.display = "none";
            adminPage.style.display = "none";
            loginPage.style.display = "none";

            gameActive = false;

            redBtn.disabled = true;
            blackBtn.disabled = true;

            alert("You are out of money.");
        }

    },1500);
}

// ======================
// BUTTONS
// ======================

redBtn.addEventListener("click", () => {
    spin("red");
});

blackBtn.addEventListener("click", () => {
    spin("black");
});

// ======================
// LEAVE BUTTON
// ======================

leaveBtn.addEventListener("click", () => {

    saveResult();

    // Stop game
    gameActive = false;

    // Reset values
    balance = 1000;
    bets = 0;
    wins = 0;
    profit = 0;
    timeLeft = 150;

    // Clear input
    nameInput.value = "";

    // Reset roulette
    resultText.textContent = "";

    redBall.style.display = "block";
    blackBall.style.display = "block";

    redBall.classList.remove("bouncing");
    blackBall.classList.remove("bouncing");

    // Reset buttons
    redBtn.disabled = false;
    blackBtn.disabled = false;

    // Update UI
    updateUI();

    timerText.textContent = "time left: 1:30";

    gameoverPage.style.display = "block";
    mainPage.style.display = "none";
    adminPage.style.display = "none";
    loginPage.style.display = "none";
});