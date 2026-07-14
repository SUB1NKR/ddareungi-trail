window.addEventListener('DOMContentLoaded', () => {
  const menuButton = document.querySelector('#menuButton');
  const menuPanel = document.querySelector('#menuPanel');
  const startButton = document.querySelector('#startButton');
  const prevButton = document.querySelector('#prevButton');
  const restartButton = document.querySelector('#restartButton');
  const introSection = document.querySelector('#introSection');
  const questionSection = document.querySelector('#questionSection');
  const findingSection = document.querySelector('#findingSection');
  const resultSection = document.querySelector('#resultSection');
  const progressBar = document.querySelector('#progressBar');
  const questionCount = document.querySelector('#questionCount');
  const questionTitle = document.querySelector('#questionTitle');
  const answerList = document.querySelector('#answerList');
  const resultImage = document.querySelector('#resultImage');
  const resultNumber = document.querySelector('#resultNumber');
  const resultName = document.querySelector('#resultName');
  const resultDescription = document.querySelector('#resultDescription');
  const resultTags = document.querySelector('#resultTags');
  const resultTime = document.querySelector('#resultTime');
  const resultDistance = document.querySelector('#resultDistance');
  const courseLink = document.querySelector('#courseLink');
  const externalNotice = document.querySelector('#externalNotice');
  const externalCancelButton = document.querySelector('#externalCancelButton');
  const externalMoveButton = document.querySelector('#externalMoveButton');
  const courseIndexExternalLink = document.querySelector('#courseIndexExternalLink');

  const menuDuration = 780;
  const courseIndexUrl = 'https://www.sisul.or.kr/open_content/traffic/bike_course/index.html';
  let currentQuestionIndex = 0;
  let selectedTags = [];
  let selectedHistory = [];
  let isMenuOpen = false;
  let isMenuClosing = false;
  let externalMoveTimer = null;
  let pendingExternalUrl = '';

  const questions = [
    { title: '오늘은 어떤 분위기로 달리고 싶나요?', answers: [
      { text: '조용히 쉬어가는 힐링 라이딩', tags: ['힐링','자연','쉼'] },
      { text: '서울의 풍경을 크게 보고 싶어요', tags: ['한강','풍경','전망'] },
      { text: '도심과 명소를 함께 둘러보고 싶어요', tags: ['도심','관광','명소'] },
      { text: '밤공기와 야경을 즐기고 싶어요', tags: ['야경','밤','낭만'] }
    ]},
    { title: '어떤 길이 가장 끌리나요?', answers: [
      { text: '강바람이 부는 한강길', tags: ['한강','강바람','자전거도로'] },
      { text: '꽃과 나무가 많은 길', tags: ['꽃','숲','자연'] },
      { text: '천을 따라 이어지는 길', tags: ['천변','하천','물멍'] },
      { text: '서울의 도시감이 느껴지는 길', tags: ['도심','도시','관광'] }
    ]},
    { title: '누구와 함께 달릴 예정인가요?', answers: [
      { text: '혼자 가볍게', tags: ['혼자','힐링','짧은거리'] },
      { text: '연인과 데이트로', tags: ['데이트','낭만','풍경'] },
      { text: '친구와 활기차게', tags: ['친구','활기','탐험'] },
      { text: '퇴근 후 나를 위해', tags: ['퇴근','야경','힐링'] }
    ]},
    { title: '어느 정도 달리고 싶나요?', answers: [
      { text: '짧고 가볍게', tags: ['짧은거리'] },
      { text: '30분 안팎으로 적당히', tags: ['중간거리'] },
      { text: '한강 따라 길게', tags: ['긴거리','한강'] },
      { text: '안전한 자전거도로 위주로', tags: ['안전','자전거도로'] }
    ]}
  ];

  const courses = [
    {id:1,name:'도심 속 메타세쿼이아 숲길 따라 따릉이가 간다~',description:'월드컵공원 메타세쿼이아 숲길과 난지한강공원을 함께 느낄 수 있는 짧고 편안한 힐링 코스입니다.',time:'14분',distance:'5km',image:'./assets/recommend/course-01.jpg',tags:['숲','자연','쉼','힐링','짧은거리','강바람','혼자']},
    {id:2,name:'불광천 따릉이길',description:'봄에는 벚꽃이 피고, 불광천과 한강, 망원재래시장과 망리단길까지 함께 즐길 수 있는 산책형 코스입니다.',time:'25분',distance:'6km',image:'./assets/recommend/course-02.jpg',tags:['벚꽃','천변','하천','동네','데이트','중간거리','꽃']},
    {id:3,name:'용산에서 노들섬, 여의도까지 자전거로 한번에!',description:'용산역에서 노들섬과 여의도한강공원까지 이어지는 코스로, 한강 풍경과 피크닉 감성을 함께 즐길 수 있습니다.',time:'23분',distance:'5km',image:'./assets/recommend/course-03.jpg',tags:['한강','풍경','데이트','힐링','짧은거리','명소']},
    {id:4,name:'고궁, 도시 그리고 자연을 달리는 서울 한 줄 요약길.',description:'경복궁, 광화문, 덕수궁, 서울역, 용산, 이촌한강공원까지 서울의 고궁과 도심, 자연을 한 번에 만나는 코스입니다.',time:'37분',distance:'9km',image:'./assets/recommend/course-04.jpg',tags:['도심','관광','명소','도시','긴거리','풍경']},
    {id:5,name:'한강공원으로 즐기는 따릉이길',description:'가양동에서 여의도까지 한강공원과 더현대를 함께 즐길 수 있어 연인과 나들이하기 좋은 코스입니다.',time:'35분',distance:'8km',image:'./assets/recommend/course-05.jpg',tags:['한강','데이트','나들이','풍경','중간거리','명소']},
    {id:6,name:'한강 따라 자전거공원 따릉따릉',description:'대부분 자전거도로로 이루어져 안전하게 달리기 좋고, 샛강 생태공원의 신선한 공기까지 느낄 수 있습니다.',time:'34분',distance:'9km',image:'./assets/recommend/course-06.jpg',tags:['한강','안전','자전거도로','자연','중간거리','힐링']},
    {id:7,name:'야경이 아름다운 따릉이 퇴근길',description:'강남과 여의도를 잇는 한강변 퇴근길 코스로, 야경과 건강한 하루 마무리를 함께 즐길 수 있습니다.',time:'48분',distance:'13km',image:'./assets/recommend/course-07.jpg',tags:['야경','퇴근','한강','밤','긴거리','낭만','안전']},
    {id:8,name:'홍제천 폭포에서 경의선 숲길 따라, 젊음의 홍대로 도심으로',description:'홍제천 폭포와 경의선숲길, 연희동과 홍대까지 이어지는 젊고 활기 있는 도심 탐험 코스입니다.',time:'28분',distance:'8km',image:'./assets/recommend/course-08.jpg',tags:['천변','숲','도심','친구','탐험','중간거리','꽃']},
    {id:9,name:'마포대교를 건너며 느끼는 여의도와 한강',description:'마포대교를 건너며 여의도와 한강의 풍경, 바람, 노을과 야경까지 다양하게 느낄 수 있는 짧은 코스입니다.',time:'17분',distance:'4km',image:'./assets/recommend/course-09.jpg',tags:['한강','강바람','전망','짧은거리','풍경','낭만']},
    {id:10,name:'청계천에서 중랑천을 따라 한강까지',description:'청계천에서 중랑천을 지나 한강까지 이어지는 물길 중심 코스로, 서울의 대표 하천을 가까이 느낄 수 있습니다.',time:'26분',distance:'6km',image:'./assets/recommend/course-10.jpg',tags:['청계천','중랑천','하천','천변','한강','중간거리']},
    {id:11,name:'따릉이와 함께 하는 한강 야경 여행',description:'뚝섬유원지역에서 동호대교, 반포대교 무지개분수, 노들섬까지 이어지는 한강 야경 감상 코스입니다.',time:'57분',distance:'13km',image:'./assets/recommend/course-11.jpg',tags:['야경','한강','밤','낭만','긴거리','자전거도로','풍경']},
    {id:12,name:'초록이 깃든 길',description:'JYP 사옥과 제2롯데월드를 잇고, 성내천의 벚꽃과 다양한 식물을 함께 만날 수 있는 초록 힐링 코스입니다.',time:'17분',distance:'4km',image:'./assets/recommend/course-12.jpg',tags:['힐링','꽃','자연','짧은거리','도시','자전거도로']},
    {id:13,name:'탁트인 목가적 풍경길',description:'탄천길에서 한강자전거길로 이어지며 미루나무, 강물, 잠실 일대의 탁 트인 풍경을 만나는 코스입니다.',time:'32분',distance:'5km',image:'./assets/recommend/course-13.jpg',tags:['탄천','한강','풍경','전망','자연','중간거리']},
    {id:14,name:'탄천따라 따릉따릉',description:'탄천의 아름다운 경관과 도심 속 자연을 느끼며 가볍게 달릴 수 있는 짧은 자연 코스입니다.',time:'15분',distance:'4km',image:'./assets/recommend/course-14.jpg',tags:['탄천','자연','하천','짧은거리','힐링','혼자']},
    {id:15,name:'여의천, 양재천과 탄천을따라 한강까지 즐기는 따릉이길',description:'여의천, 양재천, 탄천을 지나 한강까지 이어지는 긴 코스로, 자연과 강바람을 충분히 즐길 수 있습니다.',time:'1시간 7분',distance:'20km',image:'./assets/recommend/course-15.jpg',tags:['긴거리','한강','하천','자연','안전','자전거도로']},
    {id:16,name:'7호선 꽃구경! 장미꽃, 벚꽃길, 그리고 중랑천',description:'송정제방길의 벚꽃과 중랑장미공원을 함께 만나는 꽃구경 중심의 중랑천 자전거 코스입니다.',time:'37분',distance:'9km',image:'./assets/recommend/course-16.jpg',tags:['꽃','벚꽃','장미','중랑천','천변','중간거리','자연']},
    {id:17,name:'비바람 안 맞고 달리는 8km 코스 아시나요?',description:'도림천의 지붕 덮인 자전거도로를 따라 비바람과 더위를 피하며 달릴 수 있는 색다른 안전 코스입니다.',time:'42분',distance:'10km',image:'./assets/recommend/course-17.jpg',tags:['안전','자전거도로','도림천','하천','밤','색다른','중간거리']},
    {id:18,name:'힐링 출퇴근길 따릉이길',description:'안양천을 따라 출퇴근 스트레스를 덜고, 튤립과 벚꽃, 장미꽃길을 만날 수 있는 직장인 힐링 코스입니다.',time:'23분',distance:'6km',image:'./assets/recommend/course-18.jpg',tags:['퇴근','힐링','꽃','안양천','천변','중간거리','안전']},
    {id:19,name:'물멍숲멍',description:'자양한강공원에서 물멍을 시작해 어린이대공원과 중랑천까지 이어지는 물과 숲의 힐링 코스입니다.',time:'51분',distance:'6km',image:'./assets/recommend/course-19.jpg',tags:['물멍','숲','힐링','한강','중랑천','자연','친구']},
    {id:20,name:'청계천 따라 따릉따릉',description:'청계천 옆 자전거길을 달리며 동대문, 종묘, 광화문 등 서울의 도심 풍경을 함께 구경할 수 있습니다.',time:'22분',distance:'5km',image:'./assets/recommend/course-20.jpg',tags:['청계천','도심','관광','천변','짧은거리','명소']}
  ];

  function openMenu() {
    if (!menuButton || !menuPanel || isMenuClosing) return;
    isMenuOpen = true; isMenuClosing = false;
    document.body.classList.add('is-menu-open'); document.body.classList.remove('is-menu-closing');
    menuPanel.classList.remove('is-closing'); menuPanel.classList.add('is-open');
    menuButton.classList.add('is-open'); menuButton.setAttribute('aria-label', '메뉴 닫기');
  }
  function closeMenu(callback) {
    if (!menuButton || !menuPanel || !isMenuOpen || isMenuClosing) return;
    isMenuOpen = false; isMenuClosing = true;
    document.body.classList.remove('is-menu-open'); document.body.classList.add('is-menu-closing');
    menuPanel.classList.remove('is-open'); menuPanel.classList.add('is-closing');
    setTimeout(() => {
      isMenuClosing = false;
      menuPanel.classList.remove('is-closing'); menuButton.classList.remove('is-open');
      menuButton.setAttribute('aria-label', '메뉴 열기'); document.body.classList.remove('is-menu-closing');
      if (typeof callback === 'function') callback();
    }, menuDuration);
  }
  function toggleMenu() { isMenuOpen ? closeMenu() : openMenu(); }
  function getCourseExternalLink(courseId) { return `https://www.sisul.or.kr/open_content/traffic/bike_course/view.html?id=${courseId}`; }
  function hideExternalNotice() {
    clearTimeout(externalMoveTimer);
    externalMoveTimer = null;
    pendingExternalUrl = '';
    externalNotice?.classList.remove('is-visible');
    externalNotice?.setAttribute('aria-hidden', 'true');
  }
  function moveToPendingExternalUrl() {
    if (!pendingExternalUrl) return;
    window.location.href = pendingExternalUrl;
  }
  function showExternalNoticeAndMove(url) {
    if (!externalNotice) { window.location.href = url; return; }
    clearTimeout(externalMoveTimer);
    pendingExternalUrl = url;
    externalNotice.classList.add('is-visible');
    externalNotice.setAttribute('aria-hidden', 'false');
    externalMoveTimer = setTimeout(moveToPendingExternalUrl, 2200);
  }
  function initBrandCursor() {
    if (!brandCursor || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    document.body.classList.add('has-custom-cursor');
    window.addEventListener('mousemove', (event) => {
      brandCursor.classList.add('is-visible');
      brandCursor.style.transform = `translate3d(${event.clientX}px, ${event.clientY}px, 0) translate(-50%, -50%)`;
    });
    window.addEventListener('mouseleave', () => brandCursor.classList.remove('is-visible'));
    document.querySelectorAll('a, button, [role="button"]').forEach((element) => {
      element.addEventListener('mouseenter', () => brandCursor.classList.add('is-hover'));
      element.addEventListener('mouseleave', () => brandCursor.classList.remove('is-hover'));
    });
  }
  function startRecommendation() {
    selectedTags = []; selectedHistory = []; currentQuestionIndex = 0;
    introSection.style.display = 'none';
    resultSection.classList.remove('is-visible', 'is-entering');
    findingSection.classList.remove('is-visible');
    questionSection.classList.add('is-visible');
    window.scrollTo(0, 0);
    renderQuestion();
  }
  function renderQuestion() {
    const question = questions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
    questionCount.textContent = `${currentQuestionIndex + 1} / ${questions.length}`;
    questionTitle.textContent = question.title;
    progressBar.style.width = `${progress}%`;
    answerList.innerHTML = '';
    question.answers.forEach((answer) => {
      const button = document.createElement('button');
      button.type = 'button'; button.className = 'answer-button'; button.textContent = answer.text;
      button.addEventListener('click', () => { selectedTags = selectedTags.concat(answer.tags); selectedHistory.push(answer.tags); moveToNextQuestion(); });
      answerList.appendChild(button);
    });
    prevButton.disabled = currentQuestionIndex === 0;
  }
  function moveToNextQuestion() {
    currentQuestionIndex += 1;
    if (currentQuestionIndex >= questions.length) {
      questionSection.classList.remove('is-visible'); findingSection.classList.add('is-visible'); window.scrollTo(0,0);
      setTimeout(() => showResultWithTransition(), 2000);
      return;
    }
    renderQuestion();
  }
  function moveToPrevQuestion() {
    if (currentQuestionIndex <= 0) return;
    const lastTags = selectedHistory.pop();
    if (lastTags) lastTags.forEach((tag) => { const tagIndex = selectedTags.lastIndexOf(tag); if (tagIndex !== -1) selectedTags.splice(tagIndex, 1); });
    currentQuestionIndex -= 1; renderQuestion();
  }
  function getBestCourse() {
    const scores = courses.map((course) => {
      let score = 0;
      selectedTags.forEach((tag) => { if (course.tags.includes(tag)) score += 2; });
      [...new Set(selectedTags)].forEach((tag) => { if (course.name.includes(tag) || course.description.includes(tag)) score += 1; });
      return { course, score };
    });
    scores.sort((a,b) => b.score !== a.score ? b.score - a.score : a.course.id - b.course.id);
    return scores[0].course;
  }
  function showResultWithTransition() {
    findingSection.classList.remove('is-visible');
    setTimeout(() => showResult(), 520);
  }
  function showResult() {
    const bestCourse = getBestCourse();
    resultSection.classList.remove('is-entering');
    resultSection.classList.add('is-visible');
    resultSection.style.setProperty('--result-bg-image', `url("${bestCourse.image}")`);
    if (resultImage) {
      resultImage.src = bestCourse.image;
      resultImage.alt = `${bestCourse.id}번 코스 ${bestCourse.name}`;
    }
    resultNumber.textContent = `${bestCourse.id}번 코스`;
    resultName.textContent = bestCourse.name;
    resultDescription.textContent = bestCourse.description;
    resultTags.innerHTML = '';
    bestCourse.tags.slice(0, 6).forEach((tag) => { const tagElement = document.createElement('span'); tagElement.className = 'result-tag'; tagElement.textContent = `#${tag}`; resultTags.appendChild(tagElement); });
    resultTime.textContent = bestCourse.time;
    resultDistance.textContent = bestCourse.distance;
    courseLink.href = getCourseExternalLink(bestCourse.id);
    window.scrollTo(0, 0);
    requestAnimationFrame(() => resultSection.classList.add('is-entering'));
  }
  function restartRecommendation() {
    resultSection.classList.remove('is-visible', 'is-entering'); findingSection.classList.remove('is-visible'); questionSection.classList.remove('is-visible');
    introSection.style.display = 'flex';
    selectedTags = []; selectedHistory = []; currentQuestionIndex = 0;
    window.scrollTo(0, 0);
  }


  menuButton?.addEventListener('click', (event) => { event.preventDefault(); toggleMenu(); });
  startButton?.addEventListener('click', (event) => { event.preventDefault(); startRecommendation(); });
  prevButton?.addEventListener('click', moveToPrevQuestion);
  restartButton?.addEventListener('click', restartRecommendation);
  courseLink?.addEventListener('click', (event) => { event.preventDefault(); showExternalNoticeAndMove(courseLink.href); });
  externalCancelButton?.addEventListener('click', hideExternalNotice);
  externalMoveButton?.addEventListener('click', moveToPendingExternalUrl);

  courseIndexExternalLink?.addEventListener('click', (event) => {
    event.preventDefault();
    if (isMenuOpen) { closeMenu(() => showExternalNoticeAndMove(courseIndexUrl)); return; }
    showExternalNoticeAndMove(courseIndexUrl);
  });
});
