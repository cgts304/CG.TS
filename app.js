// --- APP CONFIGURATION & STORAGE ---
let adminCreds = JSON.parse(localStorage.getItem('cgts_admin_creds')) || { id: 'admin', pass: 'admin123' };

let appData = JSON.parse(localStorage.getItem('lms_data_cgts_v3')) || {
    courses: [
        { id: 'free', name: 'Free Test Series', loginRequired: false, status: 'visible' },
        { id: 'recruitment', name: 'Assistant Teacher Recruitment', loginRequired: true, status: 'visible' }
    ],
    subjects: [
        { id: 'sub1', courseId: 'free', name: 'हिन्दी व्याकरण', status: 'visible' },
        { id: 'sub2', courseId: 'recruitment', name: 'बाल विकास एवं शिक्षाशास्त्र (CDP)', status: 'visible' }
    ],
    tests: [
        { id: 't1', subId: 'sub1', name: 'हिन्दी मॉक टेस्ट - 01', type: 'code', q: "संज्ञा के कितने भेद होते हैं?", o: ["3", "4", "5", "6"], a: 2, exp: "संज्ञा के मुख्यतः 5 भेद होते हैं: व्यक्तिवाचक, जातिवाचक, भाववाचक, समूहवाचक, और द्रव्यवाचक।" },
        { id: 't2', subId: 'sub2', name: 'CDP कोर प्रैक्टिस - 01', type: 'code', q: "शिक्षण की सबसे प्रभावशाली विधि कौन सी है?", o: ["लेक्चर विधि", "खेल विधि", "प्रदर्शन विधि", "आगमन विधि"], a: 1, exp: "खेल विधि (Playway method) बच्चों के विकास के लिए सबसे उत्तम मानी जाती है।" }
    ],
    users: []
};

let currentUser = null;
let activeTest = null;

function saveToStorage() {
    localStorage.setItem('lms_data_cgts_v3', JSON.stringify(appData));
}

// --- SECURITY DOOR PANEL ---
function checkAdminAccess() {
    showPage('admin-login-page');
}

function verifyAdminLogin() {
    let idInput = document.getElementById('adm-login-id').value;
    let passInput = document.getElementById('adm-login-pass').value;

    if (idInput === adminCreds.id && passInput === adminCreds.pass) {
        document.getElementById('adm-login-id').value = "";
        document.getElementById('adm-login-pass').value = "";
        showPage('admin-panel');
    } else {
        alert("गलत एडमिन आईडी या पासवर्ड! कृपया दोबारा जांचें।");
    }
}

function toggleAdminSettings() {
    let box = document.getElementById('admin-settings-box');
    box.style.display = box.style.display === 'none' ? 'block' : 'none';
}

function updateAdminCredentials() {
    let newId = document.getElementById('new-admin-id').value;
    let newPass = document.getElementById('new-admin-pass').value;

    if (!newId || !newPass) return alert("कृपया दोनों फ़ील्ड भरें!");
    
    adminCreds.id = newId;
    adminCreds.pass = newPass;
    localStorage.setItem('cgts_admin_creds', JSON.stringify(adminCreds));
    alert("एडमिन क्रेडेंशियल सफलतापूर्वक अपडेट हो गए हैं!");
    toggleAdminSettings();
}

// --- NAVIGATION LOGIC ---
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active-page'));
    const targetPage = document.getElementById(pageId);
    if(targetPage) targetPage.classList.add('active-page');
    if(pageId === 'admin-panel') loadAdminDashboard();
}

function toggleUploadFields() {
    let type = document.getElementById('adm-upload-type').value;
    document.getElementById('upload-link-group').style.display = type === 'link' ? 'block' : 'none';
    document.getElementById('upload-code-group').style.display = type === 'code' ? 'block' : 'none';
}

// --- USER REGISTRATION & APPROVAL ---
function registerUser() {
    let name = document.getElementById('reg-name').value;
    let mobile = document.getElementById('reg-mobile').value;
    let pass = document.getElementById('reg-password').value;

    if(!name || !mobile || !pass) return alert("सभी जानकारी भरना अनिवार्य है!");

    appData.users.push({ name, mobile, pass, status: 'pending' });
    saveToStorage();
    alert("आपका रजिस्ट्रेशन सुरक्षित हो गया है! जब तक एडमिन इसे अप्रूव (Approve) नहीं करेंगे, आप लॉगिन नहीं कर पाएंगे।");
    toggleAuth(true);
}

function loginUser() {
    let mobile = document.getElementById('login-mobile').value;
    let pass = document.getElementById('login-password').value;

    let user = appData.users.find(u => u.mobile === mobile && u.pass === pass);
    if(!user) return alert("गलत मोबाइल नंबर या पासवर्ड!");
    
    if(user.status === 'pending') {
        return alert("❌ आपका अकाउंट अभी 'पेंडिंग' है। कृपया एडमिन द्वारा अप्रूवल मिलने का इंतजार करें!");
    }
    if(user.status === 'blocked' || user.status === 'rejected') {
        return alert("❌ आपका अकाउंट एडमिन द्वारा ब्लॉक या रिजेक्ट कर दिया गया है।");
    }

    currentUser = user;
    document.getElementById('logout-btn').style.display = "block";
    document.getElementById('student-welcome').innerText = `नमस्ते, ${user.name} 👋`;
    showPage('student-dashboard');
}

function logoutUser() {
    currentUser = null;
    document.getElementById('logout-btn').style.display = "none";
    showPage('main-dashboard');
}

function toggleAuth(isLogin) {
    document.getElementById('auth-title').innerText = isLogin ? "छात्र लॉगिन" : "नया छात्र रजिस्ट्रेशन";
    document.getElementById('login-form').style.display = isLogin ? "block" : "none";
    document.getElementById('register-form').style.display = isLogin ? "none" : "block";
}

// --- COURSES FLOW ---
function openCourse(courseId) {
    if(courseId === 'recruitment' && !currentUser) {
        showPage('login-page');
        return;
    }
    let targetId = (courseId === 'recruitment' || courseId === 'recruitment_secured') ? 'recruitment' : 'free';
    
    document.getElementById('subject-page-title').innerText = `${targetId === 'free' ? 'मुफ्त कोर्स' : 'शिक्षक भर्ती कोर्स'} के विषय`;
    let grid = document.getElementById('subjects-grid');
    grid.innerHTML = "";

    let filteredSubs = appData.subjects.filter(s => s.courseId === targetId);
    if(filteredSubs.length === 0) {
        grid.innerHTML = "<p style='padding:20px; color:#666;'>इस कोर्स में अभी कोई विषय उपलब्ध नहीं है।</p>";
    } else {
        filteredSubs.forEach(sub => {
            grid.innerHTML += `<div class="card" style="border-top-color:#10b981;" onclick="openSubject('${sub.id}')"><h3>${sub.name}</h3></div>`;
        });
    }
    showPage('subjects-page');
}

function goBackFromSubjects() {
    if(currentUser) showPage('student-dashboard');
    else showPage('main-dashboard');
}

function openSubject(subId) {
    let grid = document.getElementById('tests-grid');
    grid.innerHTML = "";
    let filteredTests = appData.tests.filter(t => t.subId === subId);

    if(filteredTests.length === 0) {
        grid.innerHTML = "<p style='padding:20px; color:#666;'>इस विषय में अभी कोई टेस्ट लाइव नहीं है।</p>";
    } else {
        filteredTests.forEach((test, index) => {
            grid.innerHTML += `
                <div class="card" style="border-top-color:#ef4444;" onclick="handleTestClick('${test.id}')">
                    <h4>टेस्ट बॉक्स ${index + 1}</h4>
                    <p style="margin-top:10px; font-weight:bold;">${test.name}</p>
                </div>`;
        });
    }
    showPage('tests-page');
}

function handleTestClick(testId) {
    let test = appData.tests.find(t => t.id === testId);
    if (test.type === 'link') {
        window.open(test.link, '_blank');
    } else {
        startQuiz(testId);
    }
}

// --- QUIZ FUNCTIONS ---
function startQuiz(testId) {
    activeTest = appData.tests.find(t => t.id === testId);
    document.getElementById('quiz-question-title').innerText = activeTest.q;
    let optContainer = document.getElementById('options-container');
    optContainer.innerHTML = "";

    activeTest.o.forEach((opt, idx) => {
        optContainer.innerHTML += `
            <label class="option-box">
                <input type="radio" name="quiz-opt" value="${idx}"> ${opt}
            </label>`;
    });
    showPage('quiz-page');
}

function submitQuiz() {
    let selected = document.querySelector('input[name="quiz-opt"]:checked');
    if(!selected) return alert("कृपया कोई एक विकल्प अवश्य चुनें!");

    let selectedAns = parseInt(selected.value);
    let score = (selectedAns === activeTest.a) ? 1 : 0;

    document.getElementById('score-text').innerText = `आपका कुल स्कोर: ${score} / 1`;
    
    let summaryContent = document.getElementById('summary-content');
    summaryContent.innerHTML = `
        <div style="margin-top:15px; padding:15px; border-radius:8px; background:#f9fafb;">
            <p><strong>सवाल:</strong> ${activeTest.q}</p>
            <p style="color:${score === 1 ? 'green':'red'}"><strong>आपका चुना हुआ उत्तर:</strong> ${activeTest.o[selectedAns]}</p>
            <p style="color:green"><strong>सही उत्तर:</strong> ${activeTest.o[activeTest.a]}</p>
            <p style="margin-top:10px; font-style:italic; color:#555;"><strong>उत्तर की व्याख्या:</strong> ${activeTest.exp}</p>
        </div>`;

    showPage('result-page');
}

function toggleSummary() {
    let sec = document.getElementById('summary-section');
    sec.style.display = sec.style.display === "none" ? "block" : "none";
}

// --- ADMIN SYSTEM LOGIC ---
function loadAdminDashboard() {
    let subSelect = document.getElementById('adm-test-subject');
    subSelect.innerHTML = "";
    appData.subjects.forEach(s => {
        subSelect.innerHTML += `<option value="${s.id}">${s.name}</option>`;
    });

    let tBody = document.getElementById('admin-student-table');
    tBody.innerHTML = "";
    if(appData.users.length === 0) {
        tBody.innerHTML = "<tr><td colspan='4' style='text-align:center;'>कोई छात्र रिकॉर्ड नहीं मिला।</td></tr>";
    } else {
        appData.users.forEach((u, i) => {
            let badgeClass = u.status === 'pending' ? 'badge-pending' : (u.status === 'approved' ? 'badge-free' : 'badge-req');
            tBody.innerHTML += `
                <tr>
                    <td>${u.name}</td>
                    <td>${u.mobile}</td>
                    <td><span class="badge ${badgeClass}" style="margin:0;">${u.status.toUpperCase()}</span></td>
                    <td>
                        <button class="btn btn-success" style="padding:4px 8px; font-size:12px;" onclick="updateUserStatus(${i}, 'approved')">Approve (सहमति)</button>
                        <button class="btn btn-danger" style="padding:4px 8px; font-size:12px;" onclick="updateUserStatus(${i}, 'blocked')">Block (रोकें)</button>
                    </td>
                </tr>`;
            });
    }
}

function adminCreateSubject() {
    let courseId = document.getElementById('adm-sub-course').value;
    let name = document.getElementById('adm-sub-name').value;
    if(!name) return alert("विषय का नाम भरें!");

    let id = 'sub_' + Date.now();
    appData.subjects.push({ id, courseId, name, status: 'visible' });
    saveToStorage();
    alert("नया विषय सफलतापूर्वक जोड़ दिया गया है!");
    document.getElementById('adm-sub-name').value = "";
    loadAdminDashboard();
}

function adminCreateTest() {
    let subId = document.getElementById('adm-test-subject').value;
    let testName = document.getElementById('adm-test-name').value;
    let uploadType = document.getElementById('adm-upload-type').value;

    if(!testName) return alert("टेस्ट का नाम दर्ज करें!");
    if(!subId) return alert("कृपया पहले एक विषय बनाएं!");

    let newTestObj = { id: 'test_' + Date.now(), subId: subId, name: testName, type: uploadType };

    if (uploadType === 'link') {
        let linkVal = document.getElementById('adm-test-link').value;
        if(!linkVal) return alert("कृपया वेब लिंक पेस्ट करें!");
        newTestObj.link = linkVal;
    } else {
        let q = document.getElementById('plain-q').value;
        let o1 = document.getElementById('plain-o1').value;
        let o2 = document.getElementById('plain-o2').value;
        let o3 = document.getElementById('plain-o3').value;
        let o4 = document.getElementById('plain-o4').value;
        let ans = parseInt(document.getElementById('plain-ans').value);
        let exp = document.getElementById('plain-exp').value;

        if(!q || !o1 || !o2 || !o3 || !o4) {
            return alert("कृपया प्रश्न और सभी 4 विकल्प भरें!");
        }

        newTestObj.q = q;
        newTestObj.o = [o1, o2, o3, o4];
        newTestObj.a = ans;
        newTestObj.exp = exp || "कोई व्याख्या उपलब्ध नहीं है।";
    }

    appData.tests.push(newTestObj);
    saveToStorage();
    alert("बधाई हो! नया टेस्ट लाइव अपडेट हो गया है।");
    
    // Reset fields
    document.getElementById('adm-test-name').value = "";
    document.getElementById('plain-q').value = "";
    document.getElementById('plain-o1').value = "";
    document.getElementById('plain-o2').value = "";
    document.getElementById('plain-o3').value = "";
    document.getElementById('plain-o4').value = "";
    document.getElementById('plain-exp').value = "";
}

function updateUserStatus(index, newStatus) {
    appData.users[index].status = newStatus;
    saveToStorage();
    loadAdminDashboard();
}

// Initial Run
function renderMainCourses() {
    // Basic screen initialization
}
