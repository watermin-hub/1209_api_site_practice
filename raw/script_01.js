//  7. Firebase 연동
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

// firebase-auth
import {
  getAuth,
  GithubAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// firestore
import {
  getFirestore,
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// firebase-storage
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyBCp77ilH7USjTD_76J8crJskpJ1rzF87o",
  authDomain: "fir-practice-9cca2.firebaseapp.com",
  projectId: "fir-practice-9cca2",
  storageBucket: "fir-practice-9cca2.firebasestorage.app",
  messagingSenderId: "793013487906",
  appId: "1:793013487906:web:02a74a4bb78f85cd11fd7b",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GithubAuthProvider();
const db = getFirestore(app);
const storage = getStorage(app);
// app이라는 변수에 우리의 github정보가 들어있기 때문에 app으로 연결시켜주는 건가벼~

const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const userInfo = document.getElementById("userInfo");
const chatBox = document.getElementById("chatBox");

loginBtn.addEventListener("click", () => {
  signInWithPopup(auth, provider);
});

logoutBtn.addEventListener("click", () => {
  signOut(auth).catch(console.error);
});

onAuthStateChanged(auth, (user) => {
  if (user) {
    userInfo.textContent = `로그인 사용자: ${user.displayName || user.email}`;
    loginBtn.style.display = "none";
    logoutBtn.style.display = "inline-block";
    chatBox.style.display = "block";
  } else {
    userInfo.textContent = "로그인되지 않았습니다.";
    loginBtn.style.display = "inline-block";
    logoutBtn.style.display = "none";
    chatBox.style.display = "none";
  }
});

// 8. 실시간 채팅 기능 구현
const chatMessages = document.getElementById("chatMessages");
const chatForm = document.getElementById("chatForm");
const chatInput = document.getElementById("chatInput");

const messagesRef = collection(db, "messages");
const qMessages = query(messagesRef, orderBy("created_at", "asc"));
onSnapshot(qMessages, (snapshot) => {
  chatMessages.innerHTML = "";
  snapshot.forEach((doc) => {
    const data = doc.data();
    const li = document.createElement("li");
    let html = `<strong>${data.user_name}</strong>: ${data.text || ""}`;
    if (data.imageUrl) {
      html += `<br /><img src="${data.imageUrl}" alt="image" style="max-width:200px; border-radius:8px; margin-top:4px;" />`;
    }
    li.innerHTML = html;
    chatMessages.appendChild(li);
  });
});
const chatImageInput = document.getElementById("chatImage");
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const user = auth.currentUser;
  if (!user) {
    alert("먼저 GitHub로 로그인 해주세요.");
    return;
  }
  const text = chatInput.value;
  const file = chatImageInput.files[0];
  if (!text.trim() && !file) {
    return;
  }
  let imageUrl = null;
  try {
    if (file) {
      const filePath = `chatImages/${user.uid}/${Date.now()}_${file.name}`;
      const storageRef = ref(storage, filePath);
      await uploadBytes(storageRef, file);
      imageUrl = await getDownloadURL(storageRef);
    }
    await addDoc(messagesRef, {
      user_id: user.uid,
      user_name: user.displayName || user.email,
      text,
      imageUrl,
      created_at: serverTimestamp(),
    });
    chatInput.value = "";
    chatImageInput.value = "";
  } catch (err) {
    console.error("채팅 저장 오류:", err);
    alert("메시지를 전송하는 중 오류가 발생했습니다.");
  }
});

// 1. JSON
const BOOKS_JSON_URL =
  "https://raw.githubusercontent.com/watermin-hub/1205_api_practice/refs/heads/main/books_yes24.json";

const GOODS_JSON_URL =
  "https://raw.githubusercontent.com/watermin-hub/1205_api_practice/refs/heads/main/goods_yes24.json";

// Supabase SQL API 로드
const SUPABASE_URL = "https://esvmyvqpgcsmjpcnqusd.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_YtlaYb2dkhexJykX60GxTw_rORvh_W3";
const SUPABASE_TABLE = "comments";

// 우리는 api 많아서 객체 형태로 끌어와야 함!!!!!!
// const API_URL = {
//   api1:"",
//   api1:"",
//   api1:"",
//   api1:"",
// }

// 지난 수업!
// let allBooks = [];
// async function loadBooks() {
//   const res = await fetch(API_URL);
//   allBooks = await res.json();
//   // 이거 비동기처리라서 url찾기도 전에 json 변환할 수도 있어서 await 꼭 적어줘야 함
//   console.log(allBooks);
//   // 이 함수가 allBooks 값을 출력함
//   renderBooks(allBooks);
// }

let booksData = [];
let goodsData = [];

// bookData와 goodsData를 매핑해주는 객체
const categoryGoodsMap = {
  국내도서_경제경영: "학습/독서",
  국내도서_IT: "디지털",
  국내도서_자기계발: "디자인문구",
};

let selectedBook = null;
// const <-> let : const는 변수 재할당 불가, let은 변수 재할당 가능

async function loadAllData() {
  const [books, goods] = await Promise.all([
    fetch(BOOKS_JSON_URL),
    fetch(GOODS_JSON_URL),
  ]);

  booksData = await books.json();
  goodsData = await goods.json();

  populateCategoryDropdown();

  renderBooks(booksData);
}

// 2. 브라우저 스캔 후 데이터 로드 및 렌더링 실행
window.addEventListener("DOMContentLoaded", loadAllData);

// 3. 카테고리 드롭다운 생성
function populateCategoryDropdown() {
  const categorySelect = document.getElementById("categorySelect");
  categorySelect.innerHTML = "";
  const categories = [
    ...new Set(booksData.map((b) => b.category).filter(Boolean)),
  ];
  categories.forEach((cat) => {
    const opt = document.createElement("option");
    opt.value = cat;
    opt.textContent = cat;
    categorySelect.appendChild(opt);
  });
}

// 4. 책 목록 렌더링 - API 활용 생성
function renderBooks(books) {
  const listEl = document.getElementById("bookList");
  listEl.innerHTML = "";
  books.forEach((book) => {
    const card = document.createElement("article");
    card.className = "book-card";
    const url = book.detail_url || "#";
    card.innerHTML = `
      <div class="book-thumb-wrap">
        <img src="${book.thumbnail}" alt="${book.title}">
        <button
          class="pin-btn ${isPinned ? "pinned" : ""}"
          data-detail-url="${book.detail_url}"
          data-title="${book.title}"
          data-thumbnail="${book.thumbnail || ""}"
        >
          📌
        </button>
      </div>
      <h3 class="book-title">${book.title}</h3>
      <p class="book-author">${book.author || ""}</p>
      <p class="book-price">${book.sale_price?.toLocaleString() || ""}</p>
      <button class="comment-open-btn detail-btn">댓글 보기</button>
    `;

    const btn = card.querySelector("button");
    btn.addEventListener("click", () => openCommentSection(book));

    listEl.appendChild(card);
  });
}

async function togglePin(book, buttonEl) {
  const user = auth.currentUser;
  if (!user) {
    alert("로그인 후 스크랩 기능을 사용할 수 있습니다.");
    return;
  }
  const bookUrl = book.detail_url;
  const isPinned = pinnedSet.has(bookUrl);
  if (!isPinned) {
    const payload = {
      firebase_uid: user.uid,
      book_url: bookUrl,
      title: book.title,
      thumbnail: book.thumbnail,
    };
    const res = await fetch(`${SUPABASE_URL}/rest/v1/favorites`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      console.error("스크랩 저장 실패", await res.text());
      alert("스크랩 저장 중 오류가 발생했습니다.");
      return;
    }
    pinnedSet.add(bookUrl);
    buttonEl.classList.add("pinned");
  } else {
    const deleteUrl =
      `${SUPABASE_URL}/rest/v1/favorites` +
      `?firebase_uid=eq.${user.uid}` +
      `&book_url=eq.${encodeURIComponent(bookUrl)}`;
    const res = await fetch(deleteUrl, {
      method: "DELETE",
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        Prefer: "return=minimal",
      },
    });
    if (!res.ok) {
      console.error("스크랩 삭제 실패", await res.text());
      alert("스크랩 삭제 중 오류가 발생했습니다.");
      return;
    }
    pinnedSet.delete(bookUrl);
    buttonEl.classList.remove("pinned");
  }
}

// 실질적으로 카테고리가 적용되게 만드는 함수
// 5. 책 검색 & 필터 함수
function applyFilters() {
  const qRaw = document.getElementById("searchInput").value; // 검색어
  const q = qRaw.trim().toLowerCase(); // 검색어 정규화
  const cat = document.getElementById("categorySelect").value; // 카테고리
  const filtered = booksData.filter((book) => {
    const inCategory = !cat || cat === "all" ? true : book.category === cat; // 카테고리 필터링
    const text = `${book.title || ""} ${book.author || ""} ${
      book.publisher || ""
    }`.toLowerCase(); // 검색어 필터링
    const inSearch = q ? text.includes(q) : true; // 검색어 필터링
    return inCategory && inSearch;
  });
  renderBooks(filtered);

  // 굿즈 검색 및 렌더링을 위한 코드
  if (q) {
    renderRelatedGoods(q, filtered);
  } else {
    const goodsContainer = document.getElementById("relatedGoods");
    if (goodsContainer) goodsContainer.innerHTML = "";
  }
}

// 10. 검색어 기반 관련 굿즈 출력
function renderRelatedGoods(keyword, filteredBooks) {
  const container = document.getElementById("relatedGoods");
  if (!container) return;
  container.innerHTML = "";
  if (filteredBooks.length === 0) return;
  const bookCategories = Array.from(
    new Set(filteredBooks.map((b) => b.category))
  );
  bookCategories.forEach((bookCat) => {
    const goodsCat = categoryGoodsMap[bookCat];
    if (!goodsCat) return;
    let related = goodsData.filter(
      (item) =>
        item.category === goodsCat &&
        keyword &&
        item.title &&
        item.title.toLowerCase().includes(keyword.toLowerCase())
    );
    if (related.length === 0) {
      related = goodsData.filter((item) => item.category === goodsCat);
    }
    related = related.slice(0, 10);
    if (related.length === 0) return;
    const section = document.createElement("section");
    section.className = "goods-section";
    section.innerHTML = `
      <h3>${bookCat} 검색("${keyword}") 관련 굿즈 – ${goodsCat} 추천</h3>
    `;
    const list = document.createElement("div");
    list.className = "goods-list";
    related.forEach((item) => {
      const card = document.createElement("article");
      card.className = "goods-card";
      card.innerHTML = `
        <a href="${item.detail_url}" target="_blank" rel="noopener noreferrer">
          <img src="${item.thumbnail || ""}" alt="${item.title || ""}" />
          <p class="goods-title">${item.title || ""}</p>
          ${
            item.price
              ? `<p class="goods-price">${item.price.toLocaleString()}원</p>`
              : ""
          }
        </a>
      `;
      list.appendChild(card);
    });
    section.appendChild(list);
    container.appendChild(section);
  });
}

// 11. Supabase 댓글 렌더링
// 준 Fullstack : 프론트 + 백엔드
// CRUD
// 사이트구축.플랫폼 => CRUD
// Create : 댓글 작성
// Read : 타인이 읽을 수 있어야함
// Update : 타인이 수정할 수 있는 권한 (우리는 안 쓸거임 코드 길어져서)
// Delete : 댓글 삭제 기능

// 댓글 버튼 클릭 이벤트 함수
function openCommentSection(book) {
  selectedBook = book;
  document.getElementById(
    "commentBookTitle"
  ).textContent = `댓글 - ${book.title}`;
  loadComments(book);
}

// 댓글 삭제 D : Delete
async function deleteComment(id) {
  if (!confirm("정말 이 댓글을 삭제할까요?")) return;
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/${SUPABASE_TABLE}?id=eq.${id}`,
    {
      method: "DELETE",
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        Prefer: "return=minimal",
      },
    }
  );
  if (!res.ok) {
    console.error("삭제 실패", await res.text());
    alert("댓글 삭제 중 오류가 발생했습니다.");
    return;
  }
  await loadComments(selectedBook);
}

// 댓글 조회 R : Read
async function loadComments(book) {
  const listEl = document.getElementById("commentList");
  listEl.innerHTML = "<li>댓글 불러오는 중...</li>";
  try {
    const url = `${SUPABASE_URL}/rest/v1/${SUPABASE_TABLE}?book_url=eq.${encodeURIComponent(
      book.detail_url
    )}&order=created_at.desc`;
    const res = await fetch(url, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
    });
    const rows = await res.json();
    listEl.innerHTML = "";
    const user = auth.currentUser;
    if (rows.length === 0) {
      listEl.innerHTML = "<li>첫 번째 댓글을 남겨보세요 😊</li>";
    } else {
      rows.forEach((row) => {
        const li = document.createElement("li");
        let html = `<strong>${row.nickname}</strong> : ${row.comment_text}`;
        if (user && row.firebase_uid === user.uid) {
          html += ` <button type="button" class="delete-comment" data-id="${row.id}">삭제</button>`;
        }
        li.innerHTML = html;
        listEl.appendChild(li);
      });
      listEl.querySelectorAll(".delete-comment").forEach((btn) => {
        btn.addEventListener("click", () => {
          const id = btn.getAttribute("data-id");
          deleteComment(id);
        });
      });
    }
  } catch (err) {
    console.error(err);
    listEl.innerHTML = "<li>댓글을 불러오는 중 오류가 발생했습니다.</li>";
  }
}

// 댓글 생성 C : Create
async function submitComment(e) {
  e.preventDefault();
  if (!selectedBook) {
    alert("먼저 책을 선택해주세요.");
    return;
  }
  const user = auth.currentUser; // Firebase 로그인 유저
  if (!user) {
    alert("댓글을 남기려면 먼저 GitHub로 로그인 해주세요.");
    return;
  }
  const nickname = document.getElementById("commentNickname").value;
  const text = document.getElementById("commentText").value;
  const payload = {
    book_url: selectedBook.detail_url,
    nickname,
    comment_text: text,
    firebase_uid: user.uid,
  };
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${SUPABASE_TABLE}`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("댓글 저장 실패");
    document.getElementById("commentText").value = "";
    await loadComments(selectedBook);
  } catch (err) {
    console.error(err);
    alert("댓글 저장 중 오류가 발생했습니다.");
  }
}

// 이벤트 실행
document
  .getElementById("commentForm")
  .addEventListener("submit", submitComment);

// --------------------------------------------------

// 댓글 ㅂ ㄹ 그

// 댓글 모아보기 모달 페이지
async function openMyCommentsModal() {
  const user = auth.currentUser;
  if (!user) {
    alert("먼저 GitHub로 로그인 해주세요.");
    return;
  }
  const modal = document.getElementById("myCommentsModal");
  const listEl = document.getElementById("myCommentsList");
  const wordsEl = document.getElementById("myCommentsWords");
  const sentiEl = document.getElementById("myCommentsSentiment");
  const summaryEl = document.getElementById("myCommentsSummary");
  modal.classList.remove("hidden");
  listEl.innerHTML = "<li>내 댓글을 불러오는 중...</li>";
  wordsEl.innerHTML = "";
  sentiEl.textContent = "";
  summaryEl.textContent = "";
  try {
    const url = `${SUPABASE_URL}/rest/v1/${SUPABASE_TABLE}?firebase_uid=eq.${encodeURIComponent(
      user.uid
    )}&order=created_at.desc`;
    const res = await fetch(url, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
    });
    if (!res.ok) throw new Error(await res.text());
    const rows = await res.json();
    if (rows.length === 0) {
      listEl.innerHTML = "<li>아직 작성한 댓글이 없습니다.</li>";
      summaryEl.textContent = "작성한 댓글이 없어서 통계를 계산할 수 없습니다.";
      return;
    }
    listEl.innerHTML = "";
    const allText = [];
    rows.forEach((row) => {
      const li = document.createElement("li");
      li.innerHTML = `
        <strong>${row.nickname}</strong>
        <small>${row.book_url || ""}</small>
        <span>${row.comment_text}</span>
      `;
      listEl.appendChild(li);
      if (row.comment_text) allText.push(row.comment_text);
    });
    const joined = allText.join(" ");
    const { topWords, posCount, negCount, totalWords, posTop, negTop } =
      analyzeComments(joined);
    wordsEl.innerHTML = "";
    topWords.forEach(([word, count]) => {
      const li = document.createElement("li");
      li.textContent = `${word} (${count})`;
      wordsEl.appendChild(li);
    });
    const posLabel = posTop.length
      ? posTop
          .slice(0, 5)
          .map(([w, c]) => `${w}(${c})`)
          .join(", ")
      : "없음";
    const negLabel = negTop.length
      ? negTop
          .slice(0, 5)
          .map(([w, c]) => `${w}(${c})`)
          .join(", ")
      : "없음";
    sentiEl.innerHTML = `
    긍정 단어: ${posCount}개<br>
    <small>${posLabel}</small><br><br>
    부정 단어: ${negCount}개<br>
    <small>${negLabel}</small>
    `;
    summaryEl.textContent = `총 댓글 ${rows.length}개, 분석된 단어 수: ${totalWords}개`;
  } catch (err) {
    console.error("내 댓글 로드 오류:", err);
    listEl.innerHTML = "<li>댓글을 불러오는 중 오류가 발생했습니다.</li>";
  }
}

// 댓글 모아보기 이벤트
const myCommentsToggle = document.getElementById("myCommentsToggle");
const myCommentsModal = document.getElementById("myCommentsModal");
const myCommentsClose = document.getElementById("myCommentsClose");

myCommentsToggle.addEventListener("click", openMyCommentsModal);
myCommentsClose.addEventListener("click", () => {
  myCommentsModal.classList.add("hidden");
});
myCommentsModal.addEventListener("click", (e) => {
  if (e.target === myCommentsModal) {
    myCommentsModal.classList.add("hidden");
  }
});

// --------------------------------------------------

// 6. 책 검색 필터 실제 적용
document.getElementById("searchInput").addEventListener("input", applyFilters);
document
  .getElementById("categorySelect")
  .addEventListener("change", applyFilters);

// --------------------------------------------------

// 9. 카메라 열기 / 캡처 / 닫기
const cameraButton = document.getElementById("cameraButton");
const cameraArea = document.getElementById("cameraArea");
const cameraPreview = document.getElementById("cameraPreview");
const captureButton = document.getElementById("captureButton");
const closeCameraButton = document.getElementById("closeCameraButton");

// 카메라 켜기
let cameraStream = null;
cameraButton.addEventListener("click", async () => {
  try {
    if (cameraStream) {
      cameraArea.classList.remove("hidden");
      return;
    }
    cameraStream = await navigator.mediaDevices.getUserMedia({ video: true });
    cameraPreview.srcObject = cameraStream;
    cameraArea.classList.remove("hidden");
  } catch (err) {
    console.error("카메라 접근 실패:", err);
    alert("카메라를 사용할 수 없습니다. 브라우저 권한을 확인해주세요.");
  }
});

// 카메라 끄기
function stopCamera() {
  if (cameraStream) {
    cameraStream.getTracks().forEach((track) => track.stop());
    cameraStream = null;
  }
  cameraArea.classList.add("hidden");
}
closeCameraButton.addEventListener("click", stopCamera);

// 캡처(카메라 촬영) 기능
captureButton.addEventListener("click", () => {
  if (!cameraStream) return;
  const user = auth.currentUser;
  if (!user) {
    alert("먼저 GitHub로 로그인 해주세요.");
    return;
  }
  const track = cameraStream.getVideoTracks()[0];
  const settings = track.getSettings();
  const width = settings.width || 640;
  const height = settings.height || 480;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(cameraPreview, 0, 0, width, height);
  canvas.toBlob(
    async (blob) => {
      if (!blob) return;
      try {
        const filePath = `chatImages/${user.uid}/${Date.now()}_camera.jpg`;
        const storageRef = ref(storage, filePath);
        await uploadBytes(storageRef, blob);
        const imageUrl = await getDownloadURL(storageRef);
        const text = chatInput.value;
        await addDoc(messagesRef, {
          user_id: user.uid,
          user_name: user.displayName || user.email,
          text,
          imageUrl,
          created_at: serverTimestamp(),
        });
        chatInput.value = "";
        stopCamera(); // 촬영 후 카메라 닫기
      } catch (err) {
        console.error("촬영 이미지 전송 오류:", err);
        alert("사진을 전송하는 중 오류가 발생했습니다.");
      }
    },
    "image/jpeg",
    0.9
  );
});
