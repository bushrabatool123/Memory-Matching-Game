$(document).ready(function () {

  var allSymbols = ["🌸","🍂","🌿","🌙","⭐","🦢","🕊️","🌺","🍃","🌼","🦋","🌾"];

  var levels = {
    easy: { pairs: 4, cols: 4, size: 100 },
    hard: { pairs: 8, cols: 4, size: 90  }
  };

  var currentLevel  = "easy";
  var flipped       = [];
  var matchedCount  = 0;
  var moves         = 0;
  var seconds       = 0;
  var timerInterval = null;
  var timerStarted  = false;
  var locked        = false;

  var AudioCtx = window.AudioContext || window.webkitAudioContext;
  var audioCtx = null;

  function playSound(freq, duration, type) {
    if (!AudioCtx) return;
    if (!audioCtx) audioCtx = new AudioCtx();
    if (audioCtx.state === "suspended") audioCtx.resume();

    var osc  = audioCtx.createOscillator();
    var gain = audioCtx.createGain();

    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.type = type || "sine";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }

  function playMatchSound() {
    playSound(523, 0.15, "sine");
    setTimeout(function () { playSound(784, 0.2, "sine"); }, 150);
  }

  function playWrongSound() {
    playSound(180, 0.25, "sawtooth");
  }

  function startTimer() {
    timerInterval = setInterval(function () {
      seconds++;
      $("#timer").text(seconds);
    }, 1000);
  }

  function stopTimer() {
    clearInterval(timerInterval);
  }

  function resetTimer() {
    stopTimer();
    seconds = 0;
    timerStarted = false;
    $("#timer").text("0");
  }

  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var temp = a[i];
      a[i] = a[j];
      a[j] = temp;
    }
    return a;
  }

  function buildBoard(level) {
    var cfg     = levels[level];
    var symbols = shuffle(allSymbols).slice(0, cfg.pairs);
    var deck    = shuffle(symbols.concat(symbols));

    var $board  = $("#gameBoard");
    $board.empty();

    $board.css("grid-template-columns", "repeat(" + cfg.cols + ", " + cfg.size + "px)");

    $.each(deck, function (i, sym) {
      var $card = $(
        '<div class="card">' +
          '<div class="card-inner">' +
            '<div class="card-face card-front">' + sym + '</div>' +
            '<div class="card-face card-back"></div>' +
          '</div>' +
        '</div>'
      );

      $card.css({ width: cfg.size + "px", height: cfg.size + "px" });
      $card.data("symbol", sym);
      $board.append($card);
    });
  }

  function startGame(level) {
    currentLevel = level;

    flipped      = [];
    matchedCount = 0;
    moves        = 0;
    locked       = false;

    $("#moves").text("0");
    $("#pairs").text(levels[level].pairs);
    resetTimer();

    buildBoard(level);

    $("#winMsg").removeClass("show");
  }

  $("#gameBoard").on("click", ".card", function () {
    var $card = $(this);

    if (locked) return;
    if ($card.hasClass("flipped")) return;
    if ($card.hasClass("matched")) return;

    if (!timerStarted) {
      timerStarted = true;
      startTimer();
    }

    $card.addClass("flipped");
    flipped.push($card);

    if (flipped.length < 2) return;

    moves++;
    $("#moves").text(moves);
    locked = true;

    var $first  = flipped[0];
    var $second = flipped[1];

    if ($first.data("symbol") === $second.data("symbol")) {

      $first.addClass("matched");
      $second.addClass("matched");
      playMatchSound();

      matchedCount++;
      var pairsLeft = levels[currentLevel].pairs - matchedCount;
      $("#pairs").text(pairsLeft);

      flipped = [];
      locked  = false;

      if (matchedCount === levels[currentLevel].pairs) {
        stopTimer();
        setTimeout(showWin, 500);
      }

    } else {

      playWrongSound();
      $first.addClass("shake");
      $second.addClass("shake");

      setTimeout(function () {
        $first.removeClass("flipped shake");
        $second.removeClass("flipped shake");
        flipped = [];
        locked  = false;
      }, 1000);
    }
  });

  function showWin() {
    var level = currentLevel === "easy" ? "Easy" : "Hard";
    $("#winStats").text(level + " · " + moves + " moves · " + seconds + " seconds");
    $("#winMsg").addClass("show");
  }

  $(".lvl-btn").on("click", function () {
    $(".lvl-btn").removeClass("active");
    $(this).addClass("active");
    startGame($(this).data("level"));
  });

  $("#restartBtn").on("click", function () {
    startGame(currentLevel);
  });

  $("#playAgainBtn").on("click", function () {
    $("#winMsg").removeClass("show");
    startGame(currentLevel);
  });

  startGame("easy");

});