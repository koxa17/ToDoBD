// Понесло хуйню лепить =)
const btn = document.querySelectorAll('.header a[href=""]');
btn.forEach(addListenerForBtn);

function addListenerForBtn(btn) {
    btn.addEventListener('click', function() {
        searchForm(event);
    });
}


function searchForm(event) {
    const form = document.forms[event.target.dataset.form];
    form.addEventListener('submit', sendForm.bind(form), { once: true });
}




// Sign In

class User {

    static fetch(token) {
        if (!token) {
            // TODO: нотивикацию добавить
            return Promise.resolve(`<p>Увас нет токена!</p>`)
        }
        return fetch('https://ratatype-c2d32.firebaseio.com/' + 'tasks.json' + `?auth=${token}`)
            .then(response => response.json())
            .then(data => data)
            .then(tasks => {
                if (tasks && tasks.error) {
                    return `<p class="error">${tasks.error}</p>`
                }
                document.location.href = "app.html"
            })
    }

}

function authWithEmailAndPassword(email, pass) {
    const api = `AIzaSyDhOh7k8JVKCa7_WIc9Mq2SM8IbQmXDmlE`;
    const url = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${api}`;
    return fetch(url, {
            method: 'POST',
            body: JSON.stringify({
                email: email,
                password: pass,
                returnSecureToken: true
            }),
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.error.code >= 400) {
                throw data.error;
            } else {
                return data
            }
        })

}

function sendForm(event) {
    event.preventDefault();
    const allInput = Array.from(this.elements.input);
    const valueInput = allInput.map(item => item.value);
    authWithEmailAndPassword(valueInput[0], valueInput[1]);
}