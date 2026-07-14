(() => {
  const startView = document.getElementById("startView");
  const questionView = document.getElementById("questionView");
  const resultLoading = document.getElementById("resultLoading");
  const resultView = document.getElementById("resultView");

  const startQuizButton = document.getElementById("startQuizButton");
  const prevQuestionButton = document.getElementById("prevQuestionButton");

  const questionCount = document.getElementById("questionCount");
  const questionProgress = document.getElementById("questionProgress");
  const questionTitle = document.getElementById("questionTitle");
  const questionDesc = document.getElementById("questionDesc");
  const answerList = document.getElementById("answerList");

  const resultBackground = document.getElementById("resultBackground");
  const resultNumber = document.getElementById("resultNumber");
  const resultTitle = document.getElementById("resultTitle");
  const resultDistance = document.getElementById("resultDistance");
  const resultTime = document.getElementById("resultTime");
  const resultDesc = document.getElementById("resultDesc");
  const resultTags = document.getElementById("resultTags");
  const resultDetailLink = document.getElementById("resultDetailLink");
  const restartButton = document.getElementById("restartButton");

  const questions = [
    {
      title: "오늘은 어떤 분위기의 길을 달리고 싶나요?",
      desc: "지금의 기분과 가장 가까운 장면을 골라주세요.",
      answers: [
        { title: "강과 바람이 느껴지는 길", desc: "탁 트인 풍경을 보며 여유롭게 달리고 싶어요.", tags: ["river", "open", "calm"] },
        { title: "도심을 가볍게 지나는 길", desc: "익숙한 서울의 거리를 다른 속도로 보고 싶어요.", tags: ["city", "short", "easy"] },
        { title: "공원과 초록이 많은 길", desc: "복잡한 곳보다 편안하고 산책 같은 코스가 좋아요.", tags: ["park", "green", "calm"] },
        { title: "조금 특별한 풍경이 있는 길", desc: "기억에 남는 장면이 있는 코스를 찾고 싶어요.", tags: ["view", "special", "photo"] }
      ]
    },
    {
      title: "라이딩은 어느 정도가 적당한가요?",
      desc: "무리하지 않고 즐길 수 있는 시간을 기준으로 선택해주세요.",
      answers: [
        { title: "짧고 가볍게", desc: "30분 안팎으로 부담 없이 다녀오고 싶어요.", tags: ["short", "easy"] },
        { title: "적당히 여유롭게", desc: "1시간 정도 천천히 달릴 수 있으면 좋아요.", tags: ["middle", "calm"] },
        { title: "조금 길어도 괜찮아요", desc: "풍경이 좋다면 긴 코스도 괜찮아요.", tags: ["long", "open"] },
        { title: "거리보다 분위기가 중요해요", desc: "시간보다는 코스가 주는 느낌을 보고 싶어요.", tags: ["mood", "photo"] }
      ]
    },
    {
      title: "누구와 함께 달릴 예정인가요?",
      desc: "함께하는 사람에 따라 어울리는 길도 달라집니다.",
      answers: [
        { title: "혼자", desc: "생각을 정리하며 조용히 달리고 싶어요.", tags: ["solo", "calm"] },
        { title: "친구와 함께", desc: "중간중간 멈춰서 사진도 찍고 싶어요.", tags: ["friend", "photo", "city"] },
        { title: "가족과 함께", desc: "너무 복잡하지 않고 편한 길이면 좋겠어요.", tags: ["family", "easy", "park"] },
        { title: "아직 정하지 않았어요", desc: "누구와 가도 무난한 코스를 보고 싶어요.", tags: ["easy", "middle"] }
      ]
    },
    {
      title: "코스에서 가장 기대하는 것은 무엇인가요?",
      desc: "마지막으로 가장 끌리는 기준을 선택해주세요.",
      answers: [
        { title: "좋은 풍경", desc: "달리는 동안 보이는 장면이 중요해요.", tags: ["view", "river", "photo"] },
        { title: "편한 동선", desc: "찾기 쉽고 부담 없는 코스가 좋아요.", tags: ["easy", "short"] },
        { title: "서울다운 분위기", desc: "도시의 흐름을 가까이에서 느끼고 싶어요.", tags: ["city", "special"] },
        { title: "차분한 휴식감", desc: "조용하고 편안한 시간을 보내고 싶어요.", tags: ["calm", "green", "park"] }
      ]
    }
  ];

  const courses = Array.from({ length: 20 }, (_, index) => {
    const id = index + 1;
    const names = [
      "한강 바람길", "도심 산책길", "초록 공원길", "서울 전망길", "가벼운 동네길",
      "느린 오후길", "친구와 사진길", "서울의 물길", "편안한 가족길", "도시 발견길",
      "햇살 산책길", "긴 호흡길", "혼자 달리는 길", "서울 장면길", "쉬운 시작길",
      "바람 따라 길", "느긋한 주말길", "사진 남기는 길", "초록 쉼표길", "서울 한 바퀴길"
    ];
    const tagSets = [
      ["river", "open", "view", "calm"], ["city", "short", "easy"], ["park", "green", "family", "calm"], ["view", "photo", "special"], ["short", "easy", "solo"],
      ["middle", "calm", "mood"], ["friend", "photo", "city"], ["river", "long", "open", "view"], ["family", "easy", "park"], ["city", "special", "mood"],
      ["green", "park", "calm", "photo"], ["long", "open", "river"], ["solo", "calm", "middle"], ["city", "view", "special"], ["short", "easy", "family"],
      ["open", "river", "view", "long"], ["mood", "calm", "middle"], ["photo", "friend", "view"], ["green", "park", "easy", "calm"], ["long", "city", "open", "special"]
    ];
    const distances = ["8.2km", "4.6km", "5.8km", "7.4km", "3.9km", "6.1km", "5.3km", "9.1km", "4.8km", "6.7km", "5.6km", "10.4km", "6.0km", "7.0km", "3.5km", "8.8km", "6.4km", "5.9km", "4.9km", "9.8km"];
    const times = ["약 50분", "약 30분", "약 40분", "약 55분", "약 25분", "약 45분", "약 38분", "약 1시간", "약 35분", "약 48분", "약 42분", "약 1시간 15분", "약 43분", "약 52분", "약 22분", "약 58분", "약 46분", "약 44분", "약 36분", "약 1시간 10분"];
    const descs = [
      "탁 트인 강변을 따라 달리며 서울의 넓은 풍경을 느낄 수 있는 코스입니다.",
      "익숙한 도심을 가볍게 지나며 짧은 시간 안에 서울의 리듬을 느끼는 코스입니다.",
      "공원과 녹지가 이어져 자전거를 타면서도 산책하듯 편안한 감각을 주는 길입니다.",
      "중간중간 시야가 열리는 지점이 있어 사진을 남기기 좋은 코스입니다.",
      "짧고 편안하게 다녀오기 좋은 코스로, 처음 따릉이길을 경험하는 사람에게 어울립니다.",
      "빠르게 달리기보다 주변 풍경을 천천히 바라보며 이동하기 좋은 코스입니다.",
      "함께 멈춰서 이야기하고 사진을 남기기 좋은 지점들이 이어지는 코스입니다.",
      "물가를 따라 이어지는 길 위에서 바람과 풍경을 길게 즐길 수 있습니다.",
      "복잡한 이동보다 편안한 흐름을 중심으로 구성된 가족형 코스입니다.",
      "자주 지나던 도심을 다른 시선으로 바라볼 수 있는 발견의 코스입니다.",
      "햇살과 초록이 어울리는 장면을 따라 천천히 이동하기 좋은 길입니다.",
      "조금 긴 거리지만 풍경이 이어져 완주하는 즐거움이 있는 코스입니다.",
      "혼자서도 부담 없이 달리며 생각을 정리하기 좋은 차분한 코스입니다.",
      "서울다운 풍경이 이어져 도시의 분위기를 가까이 느낄 수 있습니다.",
      "짧은 이동으로 따릉이길을 가볍게 경험하기 좋은 입문형 코스입니다.",
      "시야가 트이는 구간이 많아 달리는 감각이 잘 살아나는 코스입니다.",
      "주말 오후처럼 여유로운 분위기를 느끼며 달리기 좋은 코스입니다.",
      "여러 장면을 기록하며 이동하기 좋아 친구와 함께하기에 어울립니다.",
      "도심 속에서도 잠시 쉬어가는 느낌을 주는 초록 중심의 코스입니다.",
      "조금 더 긴 호흡으로 서울의 다양한 장면을 이어서 경험할 수 있습니다."
    ];

    return {
      id,
      name: names[index],
      distance: distances[index],
      time: times[index],
      image: `./assets/recommend/course-${String(id).padStart(2, "0")}.jpg`,
      desc: descs[index],
      tags: tagSets[index],
      link: `https://www.sisul.or.kr/open_content/traffic/bike_course/view.html?id=${id}`
    };
  });

  let currentQuestionIndex = 0;
  let selectedAnswers = [];

  function showOnly(view) {
    [startView, questionView, resultLoading, resultView].forEach((section) => {
      section.classList.remove("is-active");
      section.setAttribute("aria-hidden", "true");
    });

    view.classList.add("is-active");
    view.setAttribute("aria-hidden", "false");

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function getSelectedTags() {
    return selectedAnswers.flatMap((answer) => answer.tags);
  }

  function renderQuestion() {
    const question = questions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

    questionCount.textContent = `${currentQuestionIndex + 1} / ${questions.length}`;
    questionProgress.style.width = `${progress}%`;
    questionTitle.textContent = question.title;
    questionDesc.textContent = question.desc;

    answerList.innerHTML = "";

    question.answers.forEach((answer) => {
      const button = document.createElement("button");
      button.className = "answer-button";
      button.type = "button";

      button.innerHTML = `
        <strong>${answer.title}</strong>
        <span>${answer.desc}</span>
      `;

      button.addEventListener("click", () => {
        selectedAnswers[currentQuestionIndex] = answer;
        goNextQuestion();
      });

      answerList.appendChild(button);
    });

    prevQuestionButton.style.visibility = currentQuestionIndex === 0 ? "hidden" : "visible";
  }

  function goNextQuestion() {
    if (currentQuestionIndex < questions.length - 1) {
      currentQuestionIndex += 1;
      renderQuestion();
      return;
    }

    showResultLoading();
  }

  function goPrevQuestion() {
    if (currentQuestionIndex === 0) return;
    currentQuestionIndex -= 1;
    selectedAnswers = selectedAnswers.slice(0, currentQuestionIndex + 1);
    renderQuestion();
  }

  function showResultLoading() {
    showOnly(resultLoading);

    window.setTimeout(() => {
      const course = findBestCourse();
      renderResult(course);
    }, 2000);
  }

  function findBestCourse() {
    const selectedTags = getSelectedTags();

    const sorted = [...courses].sort((a, b) => {
      const scoreA = selectedTags.filter((tag) => a.tags.includes(tag)).length;
      const scoreB = selectedTags.filter((tag) => b.tags.includes(tag)).length;

      if (scoreB !== scoreA) return scoreB - scoreA;
      return a.id - b.id;
    });

    return sorted[0];
  }

  function renderResult(course) {
    resultBackground.style.backgroundImage = `url("${course.image}")`;
    resultNumber.textContent = `Course ${String(course.id).padStart(2, "0")}`;
    resultTitle.textContent = course.name;
    resultDistance.textContent = course.distance;
    resultTime.textContent = course.time;
    resultDesc.textContent = course.desc;
    resultDetailLink.href = course.link;

    resultTags.innerHTML = "";

    course.tags.slice(0, 4).forEach((tag) => {
      const chip = document.createElement("span");
      chip.textContent = `#${translateTag(tag)}`;
      resultTags.appendChild(chip);
    });

    showOnly(resultView);
  }

  function translateTag(tag) {
    const dictionary = {
      river: "강변",
      open: "탁트인풍경",
      calm: "여유",
      city: "도심",
      short: "짧은코스",
      easy: "쉬운길",
      park: "공원",
      green: "초록",
      view: "전망",
      special: "특별한장면",
      photo: "사진",
      middle: "적당한거리",
      long: "긴코스",
      mood: "분위기",
      solo: "혼자",
      friend: "친구와",
      family: "가족과"
    };

    return dictionary[tag] || tag;
  }

  function restart() {
    currentQuestionIndex = 0;
    selectedAnswers = [];
    renderQuestion();
    showOnly(questionView);
  }

  function startQuiz() {
    currentQuestionIndex = 0;
    selectedAnswers = [];
    renderQuestion();
    showOnly(questionView);
  }

  function bindEvents() {
    startQuizButton.addEventListener("click", startQuiz);
    prevQuestionButton.addEventListener("click", goPrevQuestion);
    restartButton.addEventListener("click", restart);
  }

  function init() {
    bindEvents();
  }

  init();
})();
