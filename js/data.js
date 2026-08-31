/*
  명언 데이터.
  브라우저에서 index.html을 그냥 더블클릭해서 열어도(=서버 없이 file://로 열어도)
  fetch()의 CORS 제한 없이 바로 동작하도록 JS 배열 형태로 직접 넣어두었습니다.

  각 명언은 category 필드로 세 가지 테마 중 하나에 속합니다.
    - "인생"     : 자기 자신과 삶을 돌아보게 하는 대사
    - "동기부여" : 도전하고 앞으로 나아갈 힘을 주는 대사
    - "인간관계" : 사랑·우정·가족 등 관계에 관한 대사
  이 category 값은 홈 화면 상단의 필터 칩, background.js의 배경 사진 검색어로 함께 쓰입니다.
*/
const QUOTES = [
  { id: "lionking-01", quote: "Remember who you are.", translation: "네가 누구인지 기억해라.", source: "라이온 킹", sourceEn: "The Lion King", year: 1994, keywords: ["자아", "정체성"], category: "인생" },
  { id: "lionking-02", quote: "The past can hurt. But the way I see it, you can either run from it or learn from it.", translation: "과거는 아프지만 도망칠 수도 있고 배울 수도 있다.", source: "라이온 킹", sourceEn: "The Lion King", year: 1994, keywords: ["성장", "극복"], category: "동기부여" },
  { id: "tangled-01", quote: "Venture outside your comfort zone. The rewards are worth it.", translation: "안전지대를 벗어나라. 그만한 가치가 있다.", source: "라푼젤", sourceEn: "Tangled", year: 2010, keywords: ["도전"], category: "동기부여" },
  { id: "frozen-01", quote: "Fear will be your enemy.", translation: "두려움이야말로 가장 큰 적이다.", source: "겨울왕국", sourceEn: "Frozen", year: 2013, keywords: ["용기"], category: "동기부여" },
  { id: "frozen2-01", quote: "The next right thing.", translation: "지금 해야 할 가장 옳은 한 가지를 하라.", source: "겨울왕국 2", sourceEn: "Frozen II", year: 2019, keywords: ["한 걸음", "희망"], category: "인생" },
  { id: "moana-01", quote: "The call isn't out there at all. It's inside me.", translation: "답은 저 멀리가 아니라 내 안에 있다.", source: "모아나", sourceEn: "Moana", year: 2016, keywords: ["자아 발견"], category: "인생" },
  { id: "moana-02", quote: "Sometimes our strengths lie beneath the surface.", translation: "우리의 강점은 때로 보이지 않는 곳에 숨어 있다.", source: "모아나", sourceEn: "Moana", year: 2016, keywords: ["잠재력"], category: "동기부여" },
  { id: "mulan-01", quote: "The flower that blooms in adversity is the most rare and beautiful of all.", translation: "역경 속에서 피어난 꽃이 가장 아름답다.", source: "뮬란", sourceEn: "Mulan", year: 1998, keywords: ["역경"], category: "동기부여" },
  { id: "pocahontas-01", quote: "Listen with your heart.", translation: "마음으로 들어라.", source: "포카혼타스", sourceEn: "Pocahontas", year: 1995, keywords: ["공감"], category: "인간관계" },
  { id: "cinderella-01", quote: "Have courage and be kind.", translation: "용기를 가지고 친절하라.", source: "신데렐라", sourceEn: "Cinderella", year: 2015, keywords: ["친절", "용기"], category: "인간관계" },
  { id: "peterpan-01", quote: "All it takes is faith and trust.", translation: "필요한 것은 믿음과 신뢰뿐이다.", source: "피터팬", sourceEn: "Peter Pan", year: 1953, keywords: ["믿음"], category: "인간관계" },
  { id: "pooh-01", quote: "You're braver than you believe, stronger than you seem, and smarter than you think.", translation: "넌 스스로 생각하는 것보다 더 용감하고 강하며 똑똑하다.", source: "곰돌이 푸", sourceEn: "Winnie the Pooh", year: 1997, keywords: ["자신감"], category: "동기부여" },
  { id: "pooh-02", quote: "Sometimes the smallest things take up the most room in your heart.", translation: "가장 작은 것이 가장 큰 자리를 차지하기도 한다.", source: "곰돌이 푸", sourceEn: "Winnie the Pooh", year: 2011, keywords: ["사랑"], category: "인간관계" },
  { id: "walle-01", quote: "I don't want to survive. I want to live.", translation: "난 단지 살아남고 싶은 것이 아니라 살아가고 싶다.", source: "월-E", sourceEn: "WALL-E", year: 2008, keywords: ["삶"], category: "인생" },
  { id: "up-01", quote: "Adventure is out there!", translation: "모험은 바로 저 밖에 있다!", source: "업", sourceEn: "Up", year: 2009, keywords: ["도전"], category: "동기부여" },
  { id: "toystory-01", quote: "To infinity and beyond!", translation: "무한을 넘어 저 너머로!", source: "토이 스토리", sourceEn: "Toy Story", year: 1995, keywords: ["꿈", "도전"], category: "동기부여" },
  { id: "findingnemo-01", quote: "Just keep swimming.", translation: "계속 앞으로 나아가.", source: "니모를 찾아서", sourceEn: "Finding Nemo", year: 2003, keywords: ["끈기"], category: "동기부여" },
  { id: "coco-01", quote: "Our memories have to be passed down by those who knew us in life.", translation: "기억은 우리를 기억하는 사람들에 의해 이어진다.", source: "코코", sourceEn: "Coco", year: 2017, keywords: ["가족", "추억"], category: "인간관계" },
  { id: "soul-01", quote: "Life is full of possibilities. You just need to know where to look.", translation: "삶은 가능성으로 가득하다. 어디를 볼지만 알면 된다.", source: "소울", sourceEn: "Soul", year: 2020, keywords: ["희망"], category: "인생" },
  { id: "insideout-01", quote: "Crying helps me slow down and obsess over the weight of life's problems.", translation: "눈물은 삶의 무게를 받아들이게 도와준다.", source: "인사이드 아웃", sourceEn: "Inside Out", year: 2015, keywords: ["감정", "치유"], category: "인생" },
];
