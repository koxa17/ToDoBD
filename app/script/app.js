// Форма
const form = document.getElementById('form');
// список ul
const list = document.querySelector('.list-group');
// кнопка очистки списка
const clearBtn = document.getElementById('btn-clear');
// инпут для задач
const input = document.getElementById('addNewTask');

// класс для управления тасками
class Task {
    // метод для отправки запросов на сервер - передаем в него обьект настроек
    static sendRequest({ url, method, id = '', body = null }) {
        // отправляем данные через фетч
        return fetch(`${url}/${id}.json`, {
                method: method,
                body: JSON.stringify(body),
                headers: {
                    'Content-Type': 'application/json;'
                }
            }) // получаем ответ и парсим
            .then(response => {
                if (response.ok) {
                    return response.json()
                } // если response не ок выводим ошибку
                return response.json().then(err => {
                    const e = new Error(`Ошибка: ${response.status}!`);
                    e.data = err;
                    throw e;
                })
            })
    }

    // метод создания тасков
    static createTask(task) {
        // создаем таск в БД
        Task.sendRequest({
                url: 'https://ratatype-c2d32.firebaseio.com/tasks',
                method: 'POST',
                body: task
            })
            .then(data => {
                // добавляем таску id, записываем в него ключ с бд
                task.id = data.name;
                return task;
            }) // сохраняем задачу в LocalStorage
            .then(setToLocalStorage)
            // рендерим все это на сайте
            .then(Task.renderList)
            .catch(err => {
                console.log(err);
            }) // отключаем анимацию loading
            .finally(loadingAnimate);
    }

    // метод отрисовки задач
    static renderList() {
        // получаем все задачи из LocalStorage
        const tasks = getFromLocalStorage();

        // тут будет лежать созданая <li> в зависимости от таском, есть они или там пусто
        let liItem = null;

        // проверяем что есть задачи
        if (tasks.length) {
            // полученый массив изменяем, прогоняя через функцию toList, которая вернет шаблон li для каждого таска
            // полученый массив джоиним в строку
            liItem = tasks.map(toList).join('');

            // включаем кнопку очистки списка тасков
            clearBtn.disabled = ''

            // TODO: удаляем слушателя с пустого списка - можно удалить
            input.removeEventListener('keydown', animateEmptyList);

            // слушаем кнопку очистки {once: true} добавлен чисто для теста, тут он не нужен
            clearBtn.addEventListener('click', Task.allClear, { once: true });
        } else {
            // если тасков нет, шаблон li что список пуст 
            liItem = `<li class="list-group-item justify-content-center align-items-center listEmpty">
            <img src="img/norm.svg" alt="Смайлик" class="emoji">
            <span class="task-title">Этот список пуст, как и твоя душа!</span>
            </li>`;

            // удаляем слушателя, так как нам удалять нечего
            clearBtn.removeEventListener('click', Task.allClear);
            // отклюдчаем кнопку
            clearBtn.disabled = true;

            // TODO: изменяем пустой список - можно удалить
            input.addEventListener('keydown', animateEmptyList);
        }

        // выводим задачи на страницу в ul
        list.innerHTML = liItem;
    }

    // метод удаления таска по id
    static delete(id) {
        // отправляем запрос на удаления таска из БД
        Task.sendRequest({
                url: `https://ratatype-c2d32.firebaseio.com/tasks`,
                method: 'DELETE',
                id: id
            }) // вызываем функцию что бы удалить со cраницы, и из localStorage
            .then(deleteTask(id))
            // рендерим список по новой, так как удалили задачу
            .then(Task.renderList);
    }

    // метод полной очистки списка
    static allClear() {
            // запускаем анимацию загрузки
            loadingAnimate();

            //удаляем все из БД
            Task.sendRequest({
                    url: `https://ratatype-c2d32.firebaseio.com/tasks`,
                    method: 'DELETE',
                })
                .then(() => {
                    // удаляем все из localStorage
                    localStorage.removeItem('tasks');

                    // рендерим список
                    Task.renderList();
                }) // отключаем анимацю загрузки 
                .finally(loadingAnimate);
        }
        // TODO: остановился тут
    static done(id) {

        Task.sendRequest({
                url: `https://ratatype-c2d32.firebaseio.com/tasks`,
                method: 'PATCH',
                id: id,
                body: {
                    done: true
                }
            })
            .then(doneTask(id))
            .then(Task.renderList);
    }

}

form.addEventListener('submit', addTask);
window.addEventListener('load', Task.renderList);


list.addEventListener('click', action.bind(this));

function addTask(e) {
    e.preventDefault();
    loadingAnimate();

    Task.createTask({
        text: input.value.trim(),
        date: new Date(),
        done: false,
    });

    input.focus();
    form.reset();
}

function toList(task) {
    if (task.done) {
        return `<li class="list-group-item d-flex justify-content-between list-group-item-success">
        <span class="task-title"><span class="strike">${task.text}</span><small class="date">${new Date(task.date).toLocaleDateString()} ${new Date(task.date).toLocaleTimeString()}</small></span>
        <div data-id="${task.id}">
            <button type="button" data-action="delete-task" class="btn btn-light align-self-end">Удалить</button>
        </div>
        </li>`
    }

    return `<li class="list-group-item d-flex justify-content-between">
    <span class="task-title">${task.text}<small class="date">${new Date(task.date).toLocaleDateString()} ${new Date(task.date).toLocaleTimeString()}</small></span>
    <div data-id="${task.id}">
        <button type="button" data-action="done-task" class="btn btn-light align-self-end">Готово</button>
        <button type="button" data-action="delete-task" class="btn btn-light align-self-end">Удалить</button>
    </div>
    </li>`;
}



function action(event) {
    const target = event.target;
    if (target.dataset.action === 'delete-task') {
        const id = target.parentElement.dataset.id;
        Task.delete(id);
    } else if (target.dataset.action === 'done-task') {
        const id = target.parentElement.dataset.id;
        Task.done(id);
    }
}

function deleteTask(id) {
    const all = getFromLocalStorage();
    all.splice(all.findIndex(task => task.id === id), 1);
    localStorage.setItem('tasks', JSON.stringify(all));
}

function doneTask(id) {
    const all = getFromLocalStorage();
    all.map(item => item.id === id ? item.done = true : false);
    localStorage.setItem('tasks', JSON.stringify(all));
}


function loadingAnimate() {
    const loading = document.querySelector('.loading');
    if (loading.children.length > 0) {
        loading.textContent = '';
        loading.style.display = 'none';
        return;
    }
    const imgLoading = '<img src="img/loading.gif" alt="" class="loading__img">';
    loading.style.display = 'flex';
    loading.insertAdjacentHTML('afterbegin', imgLoading);
}

function setToLocalStorage(task) {
    let all = getFromLocalStorage();
    all.push(task);
    localStorage.setItem('tasks', JSON.stringify(all));
}

function getFromLocalStorage() {
    return JSON.parse(localStorage.getItem('tasks') || '[]');
}


// TODO: Рофл с пустым списком - можно удалить
function animateEmptyList(event) {
    const emoji = document.getElementsByClassName('emoji')[0];
    const emptyTitle = document.getElementsByClassName('task-title')[0];

    if (event.key === 'Backspace') {
        emoji.src = 'img/backspace.svg';
        emptyTitle.textContent = 'Остановись унтерменш! Noooooo'
        if (event.target.value.length < 2) {
            setTimeout(() => {
                emoji.src = "img/norm.svg"
                emptyTitle.textContent = 'Этот список пуст, как и твоя душа!'
            }, 2000)
        }
    } else {
        emoji.src = 'img/open.svg';
        emptyTitle.textContent = 'Идет набор текста...'
    }

}