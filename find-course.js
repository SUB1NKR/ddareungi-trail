window.addEventListener("DOMContentLoaded", () => {
  const menuButton = document.querySelector("#menuButton");
  const menuPanel = document.querySelector("#menuPanel");
  const startButton = document.querySelector("#startButton");
  const prevButton = document.querySelector("#prevButton");
  const restartButton = document.querySelector("#restartButton");
  const introSection = document.querySelector("#introSection");
  const questionSection = document.querySelector("#questionSection");
  const findingSection = document.querySelector("#findingSection");
  const resultSection = document.querySelector("#resultSection");
  const progressBar = document.querySelector("#progressBar");
  const questionCount = document.querySelector("#questionCount");
  const questionTitle = document.querySelector("#questionTitle");
  const answerList = document.querySelector("#answerList");
  const resultNumber = document.querySelector("#resultNumber");
  const resultName = document.querySelector("#resultName");
  const resultDescription = document.querySelector("#resultDescription");
  const resultTags = document.querySelector("#resultTags");
  const resultTime = document.querySelector("#resultTime");
  const resultDistance = document.querySelector("#resultDistance");
  const courseLink = document.querySelector("#courseLink");
  const externalNotice = document.querySelector("#externalNotice");
  const externalNoticeClose = document.querySelector("#externalNoticeClose");
  const externalNoticeCancel = document.querySelector("#externalNoticeCancel");
  const externalNoticeConfirm = document.querySelector("#externalNoticeConfirm");
  const courseIndexExternalLink = document.querySelector("#courseIndexExternalLink");

  const menuDuration = 780;
  const courseIndexUrl = "https://www.sisul.or.kr/open_content/traffic/bike_course/index.html";
  let currentQuestionIndex = 0;
  let selectedTags = [];
  let selectedHistory = [];
  let isMenuOpen = false;
  let isMenuClosing = false;
  let pendingExternalUrl = "";

  const questions = [
    { title: "오늘은 어떤 분위기로 달리고 싶나요?", answers: [
      { text: "조용히 쉬어가는 힐링 라이딩", tags: ["힐링", "자연", "쉼"] },
      { text: "서울의 풍경을 크게 보고 싶어요", tags: ["한강", "풍경", "전망"] },
      { text: "도심과 명소를 함께 둘러보고 싶어요", tags: ["도심", "관광", "명소"] },
      { text: "밤공기와 야경을 즐기고 싶어요", tags: ["야경", "밤", "낭만"] }
    ]},
    { title: "어떤 길이 가장 끌리나요?", answers: [
      { text: "강바람이 부는 한강길", tags: ["한강", "강바람", "자전거도로"] },
      { text: "꽃과 나무가 많은 길", tags: ["꽃", "숲", "자연"] },
      { text: "천을 따라 이어지는 길", tags: ["천변", "하천", "물멍"] },
      { text: "서울의 도시감이 느껴지는 길", tags: ["도심", "도시", "관광"] }
    ]},
    { title: "누구와 함께 달릴 예정인가요?", answers: [
      { text: "혼자 가볍게", tags: ["혼자", "힐링", "짧은거리"] },
      { text: "연인과 데이트로", tags: ["데이트", "낭만", "풍경"] },
      { text: "친구와 활기차게", tags: ["친구", "활기", "탐험"] },
      { text: "퇴근 후 나를 위해", tags: ["퇴근", "야경", "힐링"] }
    ]},
    { title: "어느 정도 달리고 싶나요?", answers: [
      { text: "짧고 가볍게", tags: ["짧은거리"] },
      { text: "30분 안팎으로 적당히", tags: ["중간거리"] },
      { text: "한강 따라 길게", tags: ["긴거리", "한강"] },
      { text: "안전한 자전거도로 위주로", tags: ["안전", "자전거도로"] }
    ]}
  ];

  const courses = [
    [1,"도심 속 메타세쿼이아 숲길 따라 따릉이가 간다~","월드컵공원 메타세쿼이아 숲길과 난지한강공원을 함께 느낄 수 있는 짧고 편안한 힐링 코스입니다.","14분","5km","course-01.jpg",["숲","자연","쉼","힐링","짧은거리","강바람","혼자"]],
    [2,"불광천 따릉이길","불광천과 한강, 망원 일대를 함께 즐길 수 있는 산책형 코스입니다.","25분","6km","course-02.jpg",["벚꽃","천변","하천","데이트","중간거리","꽃"]],
    [3,"용산에서 노들섬, 여의도까지 자전거로 한번에!","용산역에서 노들섬과 여의도한강공원까지 이어지는 피크닉 감성 코스입니다.","23분","5km","course-03.jpg",["한강","풍경","데이트","힐링","짧은거리","명소"]],
    [4,"고궁, 도시 그리고 자연을 달리는 서울 한 줄 요약길.","경복궁, 광화문, 서울역, 용산, 이촌한강공원까지 서울의 고궁과 도심, 자연을 만나는 코스입니다.","37분","9km","course-04.jpg",["도심","관광","명소","도시","긴거리","풍경"]],
    [5,"한강공원으로 즐기는 따릉이길","가양동에서 여의도까지 한강공원과 더현대를 함께 즐길 수 있는 나들이 코스입니다.","35분","8km","course-05.jpg",["한강","데이트","나들이","풍경","중간거리","명소"]],
    [6,"한강 따라 자전거공원 따릉따릉","대부분 자전거도로로 이루어져 안전하게 달리기 좋고 샛강 생태공원도 느낄 수 있습니다.","34분","9km","course-06.jpg",["한강","안전","자전거도로","자연","중간거리","힐링"]],
    [7,"야경이 아름다운 따릉이 퇴근길","한강변을 따라 야경과 건강한 하루 마무리를 함께 즐길 수 있는 퇴근길 코스입니다.","48분","13km","course-07.jpg",["야경","퇴근","한강","밤","긴거리","낭만","안전"]],
    [8,"홍제천 폭포에서 경의선 숲길 따라, 젊음의 홍대로 도심으로","홍제천 폭포와 경의선숲길, 연희동과 홍대까지 이어지는 도심 탐험 코스입니다.","28분","8km","course-08.jpg",["천변","숲","도심","친구","탐험","중간거리","꽃"]],
    [9,"마포대교를 건너며 느끼는 여의도와 한강","마포대교를 건너며 여의도와 한강의 바람, 노을과 야경을 느낄 수 있는 짧은 코스입니다.","17분","4km","course-09.jpg",["한강","강바람","전망","짧은거리","풍경","낭만"]],
    [10,"청계천에서 중랑천을 따라 한강까지","청계천에서 중랑천을 지나 한강까지 이어지는 물길 중심 코스입니다.","26분","6km","course-10.jpg",["청계천","중랑천","하천","천변","한강","중간거리"]],
    [11,"따릉이와 함께 하는 한강 야경 여행","뚝섬유원지역에서 반포대교, 노들섬까지 이어지는 한강 야경 감상 코스입니다.","57분","13km","course-11.jpg",["야경","한강","밤","낭만","긴거리","자전거도로"]],
    [12,"초록이 깃든 길","성내천의 벚꽃과 다양한 식물을 함께 만날 수 있는 초록 힐링 코스입니다.","17분","4km","course-12.jpg",["힐링","꽃","자연","짧은거리","도시","자전거도로"]],
    [13,"탁트인 목가적 풍경길","탄천길에서 한강자전거길로 이어지며 탁 트인 풍경을 만나는 코스입니다.","32분","5km","course-13.jpg",["탄천","한강","풍경","전망","자연","중간거리"]],
    [14,"탄천따라 따릉따릉","탄천의 경관과 도심 속 자연을 느끼며 가볍게 달릴 수 있는 짧은 코스입니다.","15분","4km","course-14.jpg",["탄천","자연","하천","짧은거리","힐링","혼자"]],
    [15,"여의천, 양재천과 탄천을따라 한강까지 즐기는 따릉이길","여의천, 양재천, 탄천을 지나 한강까지 이어지는 긴 자연 코스입니다.","1시간 7분","20km","course-15.jpg",["긴거리","한강","하천","자연","안전","자전거도로"]],
    [16,"7호선 꽃구경! 장미꽃, 벚꽃길, 그리고 중랑천","벚꽃과 중랑장미공원을 함께 만나는 꽃구경 중심의 중랑천 코스입니다.","37분","9km","course-16.jpg",["꽃","벚꽃","장미","중랑천","천변","중간거리"]],
    [17,"비바람 안 맞고 달리는 8km 코스 아시나요?","도림천의 지붕 덮인 자전거도로를 따라 달릴 수 있는 색다른 안전 코스입니다.","42분","10km","course-17.jpg",["안전","자전거도로","도림천","하천","색다른","중간거리"]],
    [18,"힐링 출퇴근길 따릉이길","안양천을 따라 출퇴근 스트레스를 덜고 꽃길을 만날 수 있는 직장인 힐링 코스입니다.","23분","6km","course-18.jpg",["퇴근","힐링","꽃","안양천","천변","중간거리","안전"]],
    [19,"물멍숲멍","자양한강공원에서 어린이대공원과 중랑천까지 이어지는 물과 숲의 힐링 코스입니다.","51분","6km","course-19.jpg",["물멍","숲","힐링","한강","중랑천","자연"]],
    [20,"청계천 따라 따릉따릉","청계천 옆 자전거길을 달리며 동대문, 종묘, 광화문 등 도심 풍경을 구경할 수 있습니다.","22분","5km","course-20.jpg",["청계천","도심","관광","천변","짧은거리","명소"]]
  ].map(([id,name,description,time,distance,img,tags]) => ({id,name,description,time,distance,image:`./assets/recommend/${img}`,tags}));

  function openMenu(){if(!menuButton||!menuPanel||isMenuClosing)return;isMenuOpen=true;isMenuClosing=false;document.body.classList.add("is-menu-open");document.body.classList.remove("is-menu-closing");menuPanel.classList.remove("is-closing");menuPanel.classList.add("is-open");menuButton.classList.add("is-open");menuButton.setAttribute("aria-label","메뉴 닫기")}
  function closeMenu(callback){if(!menuButton||!menuPanel||!isMenuOpen||isMenuClosing)return;isMenuOpen=false;isMenuClosing=true;document.body.classList.remove("is-menu-open");document.body.classList.add("is-menu-closing");menuPanel.classList.remove("is-open");menuPanel.classList.add("is-closing");setTimeout(()=>{isMenuClosing=false;menuPanel.classList.remove("is-closing");menuButton.classList.remove("is-open");menuButton.setAttribute("aria-label","메뉴 열기");document.body.classList.remove("is-menu-closing");if(typeof callback==="function")callback()},menuDuration)}
  function toggleMenu(){isMenuOpen?closeMenu():openMenu()}
  function getCourseExternalLink(id){return `https://www.sisul.or.kr/open_content/traffic/bike_course/view.html?id=${id}`}
  function openExternalNotice(url){pendingExternalUrl=url;document.body.classList.add("is-modal-open");externalNotice?.classList.add("is-visible");externalNotice?.setAttribute("aria-hidden","false")}
  function closeExternalNotice(){pendingExternalUrl="";document.body.classList.remove("is-modal-open");externalNotice?.classList.remove("is-visible");externalNotice?.setAttribute("aria-hidden","true")}
  function confirmExternalMove(){if(!pendingExternalUrl)return closeExternalNotice();const url=pendingExternalUrl;closeExternalNotice();window.location.href=url}

  function startRecommendation(){selectedTags=[];selectedHistory=[];currentQuestionIndex=0;introSection.style.display="none";resultSection.classList.remove("is-visible","is-entering");findingSection.classList.remove("is-visible");questionSection.classList.add("is-visible");window.scrollTo(0,0);renderQuestion()}
  function renderQuestion(){const q=questions[currentQuestionIndex];progressBar.style.width=`${((currentQuestionIndex+1)/questions.length)*100}%`;questionCount.textContent=`${currentQuestionIndex+1} / ${questions.length}`;questionTitle.textContent=q.title;answerList.innerHTML="";q.answers.forEach(answer=>{const b=document.createElement("button");b.type="button";b.className="answer-button";b.textContent=answer.text;b.addEventListener("click",()=>{selectedTags=selectedTags.concat(answer.tags);selectedHistory.push(answer.tags);moveToNextQuestion()});answerList.appendChild(b)});prevButton.disabled=currentQuestionIndex===0}
  function moveToNextQuestion(){currentQuestionIndex+=1;if(currentQuestionIndex>=questions.length){questionSection.classList.remove("is-visible");findingSection.classList.add("is-visible");window.scrollTo(0,0);setTimeout(showResultWithTransition,2000);return}renderQuestion()}
  function moveToPrevQuestion(){if(currentQuestionIndex<=0)return;const last=selectedHistory.pop();if(last){last.forEach(tag=>{const i=selectedTags.lastIndexOf(tag);if(i!==-1)selectedTags.splice(i,1)})}currentQuestionIndex-=1;renderQuestion()}
  function getBestCourse(){return courses.map(course=>{let score=0;selectedTags.forEach(tag=>{if(course.tags.includes(tag))score+=2;if(course.name.includes(tag)||course.description.includes(tag))score+=1});return{course,score}}).sort((a,b)=>b.score-a.score||a.course.id-b.course.id)[0].course}
  function showResultWithTransition(){findingSection.classList.remove("is-visible");setTimeout(showResult,520)}
  function showResult(){const c=getBestCourse();resultSection.classList.remove("is-entering");resultSection.classList.add("is-visible");resultSection.style.setProperty("--result-bg-image",`url("${c.image}")`);resultNumber.textContent=`${c.id}번 코스`;resultName.textContent=c.name;resultDescription.textContent=c.description;resultTags.innerHTML="";c.tags.slice(0,6).forEach(tag=>{const el=document.createElement("span");el.className="result-tag";el.textContent=`#${tag}`;resultTags.appendChild(el)});resultTime.textContent=c.time;resultDistance.textContent=c.distance;courseLink.href=getCourseExternalLink(c.id);window.scrollTo(0,0);requestAnimationFrame(()=>resultSection.classList.add("is-entering"))}
  function restartRecommendation(){resultSection.classList.remove("is-visible","is-entering");findingSection.classList.remove("is-visible");questionSection.classList.remove("is-visible");introSection.style.display="flex";selectedTags=[];selectedHistory=[];currentQuestionIndex=0;window.scrollTo(0,0)}

  menuButton?.addEventListener("click", e=>{e.preventDefault();toggleMenu()});
  startButton?.addEventListener("click", e=>{e.preventDefault();startRecommendation()});
  prevButton?.addEventListener("click", moveToPrevQuestion);
  restartButton?.addEventListener("click", restartRecommendation);
  courseLink?.addEventListener("click", e=>{e.preventDefault();openExternalNotice(courseLink.href)});
  courseIndexExternalLink?.addEventListener("click", e=>{e.preventDefault();const open=()=>openExternalNotice(courseIndexUrl);isMenuOpen?closeMenu(open):open()});
  externalNoticeClose?.addEventListener("click", closeExternalNotice);
  externalNoticeCancel?.addEventListener("click", closeExternalNotice);
  externalNoticeConfirm?.addEventListener("click", confirmExternalMove);
  externalNotice?.addEventListener("click", e=>{if(e.target===externalNotice)closeExternalNotice()});
});
