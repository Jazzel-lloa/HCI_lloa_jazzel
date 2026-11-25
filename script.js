const STORAGE_KEY = "apex_student_portal_v1";

const DEFAULT_DATA = {
  student: {
    name: "Maya Chen",
    id: "20240891",
    program: "B.S. Computer Science · Junior Year",
    advisor: "Dr. R. Vance",
    email: "maya.chen@apex.edu",
    phone: "(555) 234-8910",
    residence: "Oakwood Hall, Room 312",
    attendance: 96
  },
  courses: [
    {
      code: "CS 302",
      title: "Data Structures & Algorithms",
      days: ["Mon", "Wed", "Fri"],
      time: "2:00 PM – 3:15 PM",
      location: "Science Bldg · Room 4B",
      instructor: "Prof. Elena Rostova",
      credits: 4,
      score: 94,
      gradePoints: 4.0
    },
    {
      code: "MATH 240",
      title: "Linear Algebra & Matrices",
      days: ["Tue", "Thu"],
      time: "10:00 AM – 11:30 AM",
      location: "Euler Hall · Room 201",
      instructor: "Dr. Marcus Bell",
      credits: 4,
      score: 89,
      gradePoints: 3.7
    },
    {
      code: "CS 315",
      title: "Web Systems & Architecture",
      days: ["Tue", "Thu"],
      time: "1:00 PM – 2:30 PM",
      location: "Innovation Lab · 108",
      instructor: "Prof. Devon Brooks",
      credits: 4,
      score: 96,
      gradePoints: 4.0
    },
    {
      code: "HUM 210",
      title: "Ethics in Emerging Tech",
      days: ["Mon", "Wed"],
      time: "4:00 PM – 5:15 PM",
      location: "Liberal Arts · Room 114",
      instructor: "Dr. Priya Nair",
      credits: 4,
      score: 91,
      gradePoints: 3.7
    }
  ],
  announcements: [
    {
      id: "n1",
      title: "Spring 2027 Priority Registration Opens Monday",
      category: "Academic",
      date: "Nov 24, 2026",
      unread: true,
      body: "Junior standing students can view degree audit holds and reserve seat windows starting Monday at 8:00 AM."
    },
    {
      id: "n2",
      title: "Extended Library Hours During Finals Prep",
      category: "Campus",
      date: "Nov 22, 2026",
      unread: true,
      body: "The main library and quiet study pods will remain open until 2:00 AM starting next week."
    },
    {
      id: "n3",
      title: "Annual Student Hackathon — Team Signups Open",
      category: "Events",
      date: "Nov 18, 2026",
      unread: false,
      body: "Form a team of up to four students and submit your project idea by December 4."
    }
  ]
};

let state = loadState();
let activeView = "dashboard";
let selectedDay = "ALL";
let selectedCategory = "ALL";
let searchQuery = "";

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(DEFAULT_DATA);
    return { ...structuredClone(DEFAULT_DATA), ...JSON.parse(raw) };
  } catch {
    return structuredClone(DEFAULT_DATA);
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function initials(name) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
}

function letterFromScore(score) {
  if (score >= 93) return "A";
  if (score >= 90) return "A-";
  if (score >= 87) return "B+";
  if (score >= 83) return "B";
  if (score >= 80) return "B-";
  return "C+";
}

function calculateGpa(courses) {
  const totalCredits = courses.reduce((sum, c) => sum + c.credits, 0);
  if (!totalCredits) return "0.00";
  const weighted = courses.reduce((sum, c) => sum + c.gradePoints * c.credits, 0);
  return (weighted / totalCredits).toFixed(2);
}

const VIEW_META = {
  dashboard: {
    title: "Dashboard",
    subtitle: "Welcome back — here is your academic snapshot."
  },
  schedule: {
    title: "Class Schedule",
    subtitle: "Weekly lecture and lab timetable."
  },
  grades: {
    title: "Grades & GPA",
    subtitle: "Course breakdowns and cumulative standing."
  },
  announcements: {
    title: "Announcements",
    subtitle: "Campus news, registration windows, and deadlines."
  },
  profile: {
    title: "Student Profile",
    subtitle: "Personal details and contact preferences."
  }
};

function switchView(viewName) {
  activeView = viewName;
  document.querySelectorAll(".nav-item").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.view === viewName);
  });
  document.querySelectorAll(".view").forEach((sec) => {
    sec.classList.toggle("active", sec.id === `view-${viewName}`);
  });
  document.getElementById("pageTitle").textContent = VIEW_META[viewName].title;
  document.getElementById("pageSubtitle").textContent = VIEW_META[viewName].subtitle;
  document.getElementById("sidebar").classList.remove("open");
  render();
}

function renderDashboard() {
  const gpa = calculateGpa(state.courses);
  const totalCredits = state.courses.reduce((s, c) => s + c.credits, 0);
  const nextCourse = state.courses[0];

  document.getElementById("statGpa").textContent = gpa;
  document.getElementById("statCredits").textContent = totalCredits;
  document.getElementById("statAttendance").textContent = `${state.student.attendance}%`;

  if (nextCourse) {
    document.getElementById("statNextClass").textContent = nextCourse.code;
    document.getElementById("statNextClassTime").textContent =
      `${nextCourse.days.join("/")} · ${nextCourse.time.split("–")[0].trim()} · ${nextCourse.location}`;
  }

  const todayContainer = document.getElementById("dashboardTodayList");
  todayContainer.innerHTML = state.courses
    .slice(0, 3)
    .map(
      (c) => `
      <div class="list-row">
        <div>
          <strong>${c.code} · ${c.title}</strong>
          <div class="muted small">${c.location} · ${c.instructor}</div>
        </div>
        <span class="chip">${c.time}</span>
      </div>
    `
    )
    .join("");

  const noticesContainer = document.getElementById("dashboardNoticesList");
  noticesContainer.innerHTML = state.announcements
    .slice(0, 3)
    .map(
      (n) => `
      <div class="list-row ${n.unread ? "unread" : ""}">
        <div>
          <strong>${n.title}</strong>
          <div class="muted small">${n.category} · ${n.date}</div>
        </div>
      </div>
    `
    )
    .join("");
}

function renderSchedule() {
  const q = searchQuery.toLowerCase();
  const filtered = state.courses.filter((c) => {
    const matchesDay = selectedDay === "ALL" || c.days.includes(selectedDay);
    const matchesSearch =
      !q ||
      c.code.toLowerCase().includes(q) ||
      c.title.toLowerCase().includes(q) ||
      c.instructor.toLowerCase().includes(q);
    return matchesDay && matchesSearch;
  });

  const tbody = document.getElementById("scheduleTableBody");
  tbody.innerHTML = filtered.length
    ? filtered
        .map(
          (c) => `
        <tr>
          <td><strong>${c.code}</strong></td>
          <td>${c.title}</td>
          <td>${c.days.join(", ")}</td>
          <td>${c.time}</td>
          <td>${c.location}</td>
          <td>${c.instructor}</td>
        </tr>
      `
        )
        .join("")
    : `<tr><td colspan="6" class="muted">No classes match your current filter.</td></tr>`;
}

function renderGrades() {
  const gpa = calculateGpa(state.courses);
  document.getElementById("computedGpa").textContent = gpa;
  document.getElementById("termStandingTitle").textContent =
    parseFloat(gpa) >= 3.5 ? "Dean's List Standing" : "Good Academic Standing";

  const container = document.getElementById("gradesList");
  container.innerHTML = state.courses
    .map(
      (c) => `
      <article class="card">
        <div class="grade-card-top">
          <div>
            <span class="muted small">${c.code} · ${c.credits} Credits</span>
            <h3>${c.title}</h3>
          </div>
          <span class="letter-grade">${letterFromScore(c.score)}</span>
        </div>
        <div class="progress-track">
          <div class="progress-fill" style="width: ${c.score}%"></div>
        </div>
        <div class="muted small">Current Score: <strong>${c.score}%</strong> · Instructor: ${c.instructor}</div>
      </article>
    `
    )
    .join("");
}

function renderAnnouncements() {
  const q = searchQuery.toLowerCase();
  const filtered = state.announcements.filter((n) => {
    const matchesCat = selectedCategory === "ALL" || n.category === selectedCategory;
    const matchesSearch =
      !q || n.title.toLowerCase().includes(q) || n.body.toLowerCase().includes(q);
    return matchesCat && matchesSearch;
  });

  const unreadCount = state.announcements.filter((n) => n.unread).length;
  const badge = document.getElementById("unreadCount");
  badge.textContent = unreadCount;
  badge.classList.toggle("hidden", unreadCount === 0);

  const container = document.getElementById("announcementsList");
  container.innerHTML = filtered.length
    ? filtered
        .map(
          (n) => `
        <article class="card list-row ${n.unread ? "unread" : ""}">
          <div>
            <div class="muted small">${n.category} · ${n.date} ${n.unread ? "· <strong>Unread</strong>" : ""}</div>
            <h3>${n.title}</h3>
            <p class="muted">${n.body}</p>
          </div>
          ${
            n.unread
              ? `<button class="btn btn-secondary" data-read-id="${n.id}">Mark read</button>`
              : ""
          }
        </article>
      `
        )
        .join("")
    : `<div class="card muted">No announcements match this filter.</div>`;
}

function renderProfile() {
  const s = state.student;
  const code = initials(s.name);
  document.getElementById("sidebarAvatar").textContent = code;
  document.getElementById("sidebarName").textContent = s.name;
  document.getElementById("sidebarId").textContent = `ID: ${s.id}`;

  document.getElementById("profileAvatar").textContent = code;
  document.getElementById("profileDisplayName").textContent = s.name;
  document.getElementById("profileProgram").textContent = s.program;
  document.getElementById("profileStudentId").textContent = `ID: ${s.id}`;
  document.getElementById("profileAdvisor").textContent = `Advisor: ${s.advisor}`;

  document.getElementById("inputName").value = s.name;
  document.getElementById("inputEmail").value = s.email;
  document.getElementById("inputPhone").value = s.phone;
  document.getElementById("inputResidence").value = s.residence;
}

function render() {
  renderProfile();
  renderDashboard();
  renderSchedule();
  renderGrades();
  renderAnnouncements();
}

// Event Listeners
document.querySelectorAll(".nav-item").forEach((btn) => {
  btn.addEventListener("click", () => switchView(btn.dataset.view));
});

document.querySelectorAll("[data-jump]").forEach((btn) => {
  btn.addEventListener("click", () => switchView(btn.dataset.jump));
});

document.getElementById("menuToggle").addEventListener("click", () => {
  document.getElementById("sidebar").classList.toggle("open");
});

document.getElementById("globalSearch").addEventListener("input", (e) => {
  searchQuery = e.target.value.trim();
  renderSchedule();
  renderAnnouncements();
});

document.getElementById("dayFilters").addEventListener("click", (e) => {
  const pill = e.target.closest(".pill");
  if (!pill) return;
  selectedDay = pill.dataset.day;
  document.querySelectorAll("#dayFilters .pill").forEach((p) => p.classList.remove("active"));
  pill.classList.add("active");
  renderSchedule();
});

document.getElementById("categoryFilters").addEventListener("click", (e) => {
  const pill = e.target.closest(".pill");
  if (!pill) return;
  selectedCategory = pill.dataset.cat;
  document.querySelectorAll("#categoryFilters .pill").forEach((p) => p.classList.remove("active"));
  pill.classList.add("active");
  renderAnnouncements();
});

document.getElementById("announcementsList").addEventListener("click", (e) => {
  const btn = e.target.closest("[data-read-id]");
  if (!btn) return;
  const notice = state.announcements.find((n) => n.id === btn.dataset.readId);
  if (notice) {
    notice.unread = false;
    saveState();
    renderAnnouncements();
    renderDashboard();
  }
});

document.getElementById("markAllReadBtn").addEventListener("click", () => {
  state.announcements.forEach((n) => (n.unread = false));
  saveState();
  renderAnnouncements();
  renderDashboard();
});

document.getElementById("profileForm").addEventListener("submit", (e) => {
  e.preventDefault();
  state.student.name = document.getElementById("inputName").value.trim() || state.student.name;
  state.student.email = document.getElementById("inputEmail").value.trim();
  state.student.phone = document.getElementById("inputPhone").value.trim();
  state.student.residence = document.getElementById("inputResidence").value.trim();
  saveState();
  renderProfile();
  const status = document.getElementById("saveStatus");
  status.textContent = "Profile updated.";
  setTimeout(() => (status.textContent = ""), 2500);
});

document.getElementById("resetDemoBtn").addEventListener("click", () => {
  localStorage.removeItem(STORAGE_KEY);
  state = structuredClone(DEFAULT_DATA);
  render();
  const status = document.getElementById("saveStatus");
  status.textContent = "Demo data restored.";
  setTimeout(() => (status.textContent = ""), 2500);
});

render();