const taskForm = document.getElementById('task-form');
const inputBox = document.getElementById('input-box');
const dueDateInput = document.getElementById('due-date');
const prioritySelect = document.getElementById('priority');
const listContainer = document.getElementById('list-container');
const timerElement = document.getElementById('timer');
const timerButton = document.getElementById('timer-button');
const timerIcon = document.getElementById('timer-icon');
const tasksLeftElement = document.getElementById('tasks-left');
const clearCompletedButton = document.getElementById('clear-completed');
const filterButtons = document.querySelectorAll('.filter-btn');
const notificationsContainer = document.getElementById('notifications');
const notificationToggleBtn = document.getElementById('notification-toggle');

let timer;
let isTimerRunning = true;
let seconds = 0;
let minutes = 0;
let hours = 0;
let notificationsEnabled = false;

function updateTimer() {
    seconds++;
    if (seconds >= 60) {
        seconds = 0;
        minutes++;
        if (minutes >= 60) {
            minutes = 0;
            hours++;
        }
    }
    timerElement.textContent = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function toggleTimer() {
    if (isTimerRunning) {
        clearInterval(timer);
        timerIcon.className = 'fas fa-play';
    } else {
        timer = setInterval(updateTimer, 1000);
        timerIcon.className = 'fas fa-pause';
    }
    isTimerRunning = !isTimerRunning;
}

timerButton.addEventListener('click', toggleTimer);

taskForm.addEventListener('submit', function(e) {
    e.preventDefault();
    addTask();
});

function formatDate(date) {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function addTask() {
    if (inputBox.value === '') {
        showNotification('Please enter a task!');
        return;
    }

    const taskText = inputBox.value;
    const dueDate = formatDate(dueDateInput.value);
    const priority = prioritySelect.value;

    let li = document.createElement('li');
    li.innerHTML = `
        <div class="task-info">
            <span class="task-text">${taskText}</span>
            <span class="task-details">
                <span class="priority-indicator priority-${priority}"></span>
                ${priority.charAt(0).toUpperCase() + priority.slice(1)} Priority | Due: ${dueDate}
            </span>
        </div>
        <div class="task-actions">
            <button class="check-btn"><i class="fas fa-check"></i></button>
            <button class="edit-btn"><i class="fas fa-edit"></i></button>
            <button class="delete-btn"><i class="fas fa-trash"></i></button>
        </div>
    `;
    listContainer.appendChild(li);

    inputBox.value = '';
    dueDateInput.value = '';
    prioritySelect.value = '';

    updateTasksLeft();
    saveData();
    scheduleNotification(taskText, dueDate);
}

listContainer.addEventListener('click', function(e) {
    if (e.target.tagName === 'LI' || e.target.classList.contains('task-text')) {
        e.target.closest('li').classList.toggle('checked');
        updateTasksLeft();
        saveData();
    } else if (e.target.classList.contains('fa-trash') || e.target.classList.contains('delete-btn')) {
        e.target.closest('li').remove();
        updateTasksLeft();
        saveData();
    } else if (e.target.classList.contains('fa-check') || e.target.classList.contains('check-btn')) {
        e.target.closest('li').classList.toggle('checked');
        updateTasksLeft();
        saveData();
    } else if (e.target.classList.contains('fa-edit') || e.target.classList.contains('edit-btn')) {
        editTask(e.target.closest('li'));
    }
}, false);

function editTask(taskElement) {
    const taskInfo = taskElement.querySelector('.task-info');
    const taskText = taskInfo.querySelector('.task-text');
    const taskDetails = taskInfo.querySelector('.task-details');
    const oldText = taskText.textContent;
    const oldDate = taskDetails.textContent.split('Due: ')[1].trim();
    const oldPriority = taskDetails.querySelector('.priority-indicator').classList[1].split('-')[1];

    taskInfo.innerHTML = `
        <input type="text" class="edit-task-text" value="${oldText}">
        <input type="date" class="edit-task-date" value="${formatDate(oldDate)}">
        <select class="edit-task-priority">
            <option value="low" ${oldPriority === 'low' ? 'selected' : ''}>
                <span class="priority-dot priority-low"></span> Low
            </option>
            <option value="medium" ${oldPriority === 'medium' ? 'selected' : ''}>
                <span class="priority-dot priority-medium"></span> Medium
            </option>
            <option value="high" ${oldPriority === 'high' ? 'selected' : ''}>
                <span class="priority-dot priority-high"></span> High
            </option>
        </select>
    `;

    const taskActions = taskElement.querySelector('.task-actions');
    taskActions.innerHTML = `
        <button class="save-btn"><i class="fas fa-save"></i></button>
        <button class="cancel-btn"><i class="fas fa-times"></i></button>
    `;

    const saveBtn = taskActions.querySelector('.save-btn');
    const cancelBtn = taskActions.querySelector('.cancel-btn');

    saveBtn.addEventListener('click', function() {
        const newText = taskElement.querySelector('.edit-task-text').value;
        const newDate = formatDate(taskElement.querySelector('.edit-task-date').value);
        const newPriority = taskElement.querySelector('.edit-task-priority').value;

        taskInfo.innerHTML = `
            <span class="task-text">${newText}</span>
            <span class="task-details">
                <span class="priority-indicator priority-${newPriority}"></span>
                ${newPriority.charAt(0).toUpperCase() + newPriority.slice(1)} Priority | Due: ${newDate}
            </span>
        `;

        restoreTaskActions(taskElement);
        saveData();
        scheduleNotification(newText, newDate);
    });

    cancelBtn.addEventListener('click', function() {
        taskInfo.innerHTML = `
            <span class="task-text">${oldText}</span>
            <span class="task-details">
                <span class="priority-indicator priority-${oldPriority}"></span>
                ${oldPriority.charAt(0).toUpperCase() + oldPriority.slice(1)} Priority | Due: ${oldDate}
            </span>
        `;

        restoreTaskActions(taskElement);
    });
}

function restoreTaskActions(taskElement) {
    const taskActions = taskElement.querySelector('.task-actions');
    taskActions.innerHTML = `
        <button class="check-btn"><i class="fas fa-check"></i></button>
        <button class="edit-btn"><i class="fas fa-edit"></i></button>
        <button class="delete-btn"><i class="fas fa-trash"></i></button>
    `;
}

clearCompletedButton.addEventListener('click', function() {
    const completedTasks = listContainer.querySelectorAll('li.checked');
    completedTasks.forEach(task => task.remove());
    updateTasksLeft();
    saveData();
});

function updateTasksLeft() {
    const totalTasks = listContainer.querySelectorAll('li').length;
    const completedTasks = listContainer.querySelectorAll('li.checked').length;
    tasksLeftElement.textContent = `${totalTasks - completedTasks} tasks left`;
}

function saveData() {
    localStorage.setItem('taskList', listContainer.innerHTML);
}

function showTasks() {
    listContainer.innerHTML = localStorage.getItem('taskList') || '';
    updateTasksLeft();
    checkOverdueTasks();
}

filterButtons.forEach(button => {
    button.addEventListener('click', () => {
        filterButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        const filter = button.getAttribute('data-filter');
        filterTasks(filter);
    });
});

function filterTasks(filter) {
    const tasks = listContainer.querySelectorAll('li');
    tasks.forEach(task => {
        switch(filter) {
            case 'all':
                task.style.display = 'flex';
                break;
            case 'active':
                if(task.classList.contains('checked')) {
                    task.style.display = 'none';
                } else {
                    task.style.display = 'flex';
                }
                break;
            case 'completed':
                if(task.classList.contains('checked')) {
                    task.style.display = 'flex';
                } else {
                    task.style.display = 'none';
                }
                break;
        }
    });
}

function toggleNotifications() {
    if (!("Notification" in window)) {
        alert("This browser does not support desktop notification");
        return;
    }

    if (Notification.permission === "granted") {
        notificationsEnabled = !notificationsEnabled;
        updateNotificationToggle();
    } else if (Notification.permission !== "denied") {
        Notification.requestPermission().then(function (permission) {
            if (permission === "granted") {
                notificationsEnabled = true;
                updateNotificationToggle();
            }
        });
    } else {
        alert("Notification permission is denied. Please enable it in your browser settings.");
    }
}

function updateNotificationToggle() {
    if (notificationsEnabled) {
        notificationToggleBtn.classList.add('enabled');
        notificationToggleBtn.title = "Disable Notifications";
    } else {
        notificationToggleBtn.classList.remove('enabled');
        notificationToggleBtn.title = "Enable Notifications";
    }
}

function showNotification(message) {
    if (!notificationsEnabled) {
        console.log("Notifications are disabled");
        return;
    }

    if (Notification.permission === "granted") {
        const notification = new Notification("TaskMaster Pro", {
            body: message,
            icon: "img/notification-bell.png"
        });
    } else {
        console.log("Notification permission is not granted");
    }

    // Always show in-app notification
    const inAppNotification = document.createElement('div');
    inAppNotification.classList.add('notification');
    inAppNotification.textContent = message;
    notificationsContainer.appendChild(inAppNotification);

    setTimeout(() => {
        inAppNotification.classList.add('show');
    }, 10);

    setTimeout(() => {
        inAppNotification.classList.remove('show');
        setTimeout(() => {
            inAppNotification.remove();
        }, 300);
    }, 3000);
}

function scheduleNotification(taskText, dueDate) {
    const now = new Date();
    const taskDate = new Date(dueDate);
    const timeDiff = taskDate - now;

    if (timeDiff > 0) {
        setTimeout(() => {
            showNotification(`Task due: ${taskText}`);
        }, timeDiff);
    }
}

function checkOverdueTasks() {
    const now = new Date();
    const tasks = listContainer.querySelectorAll('li');
    tasks.forEach(task => {
        const dateString = task.querySelector('.task-details').textContent.split('Due: ')[1];
        const taskDate = new Date(dateString);
        if (taskDate < now && !task.classList.contains('checked')) {
            showNotification(`Overdue task: ${task.querySelector('.task-text').textContent}`);
        }
    });
}

notificationToggleBtn.addEventListener('click', toggleNotifications);

showTasks();
updateNotificationToggle();
timer = setInterval(updateTimer, 1000);
