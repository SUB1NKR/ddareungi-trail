(() => {
  'use strict';

  const courses = [
    {
      name: '한강 노을길',
      summary: '한강변을 따라 풍경을 감상하며 달리기 좋은 코스입니다.',
      tags: ['view', 'river', 'couple', 'medium', 'safe'],
      labels: ['#한강', '#노을', '#풍경'],
    },
    {
      name: '공원 산책길',
      summary: '초록이 많은 공원 주변을 여유롭게 지나가는 힐링 코스입니다.',
      tags: ['healing', 'park', 'alone', 'short', 'safe'],
      labels: ['#공원', '#힐링', '#가벼운라이딩'],
    },
    {
      name: '도심 라이딩길',
      summary: '서울의 도시 풍경을 가까이에서 느낄 수 있는 코스입니다.',
      tags: ['city', 'urban', 'friends', 'medium'],
      labels: ['#도심', '#친구와함께', '#서울풍경'],
    },
    {
      name: '퇴근 후 야경길',
      summary: '하루를 마무리하며 짧게 달리기 좋은 야경 중심 코스입니다.',
      tags: ['night', 'river', 'afterwork', 'short'],
      labels: ['#야경', '#퇴근후', '#짧은코스'],
    },
    {
      name: '천변 따라가는 길',
      summary: '천변을 따라 안정적으로 이어지는 자전거도로 중심 코스입니다.',
      tags: ['healing', 'stream', 'alone', 'long', 'safe'],
      labels: ['#천변', '#안전한길', '#장거리'],
    },
  ];

  const form = document.querySelector('#courseForm');
  const resultPanel = document.querySelector('#resultPanel');

  function getSelectedValues() {
    return ['mood', 'type', 'with', 'distance']
      .map((name) => new FormData(form).get(name))
      .filter(Boolean);
  }

  function recommend(values) {
    return courses
      .map((course) => ({
        ...course,
        score: course.tags.filter((tag) => values.includes(tag)).length,
      }))
      .sort((a, b) => b.score - a.score)[0];
  }

  function renderResult(course) {
    resultPanel.innerHTML = `
      <p class="result-kicker">Recommended Course</p>
      <h2>${course.name}</h2>
      <p>${course.summary}</p>
      <div class="result-tags" aria-label="추천 코스 태그">
        ${course.labels.map((label) => `<span>${label}</span>`).join('')}
      </div>
    `;
  }

  form?.addEventListener('submit', (event) => {
    event.preventDefault();
    const values = getSelectedValues();
    const course = recommend(values);
    renderResult(course);
  });
})();
