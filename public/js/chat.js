const socket = io();
const $messageForm = document.querySelector('form');
const $messageFormInput = $messageForm.querySelector('input');
const $messageFormButton = $messageForm.querySelector('button');
const $sendLocationButton = document.querySelector('#sendLocation');
//location to render template.
const $messages = document.querySelector('#messages'); //where we want to insert the templates
//our templates
const messageTemplate = document.querySelector('#message-template').innerHTML;
const locationMessageTemplate = document.querySelector('#location-template').innerHTML;
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML;

//our options
const {username, room} = Qs.parse(location.search, {ignoreQueryPrefix: true})

const autoScroll = () => {
    //TODO Recheck this function and understand how it really works.
    //New message element.
    const $newMessage = $messages.lastElementChild;

    //Height of the new message
    const newMessageStyles = getComputedStyle($newMessage);
    const newMessageMargin = parseInt(newMessageStyles.marginBottom);
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin;

    //visible height.
    const visibleHeight = $messages.offsetHeight;

    const containerHeight = $messages.scrollHeight;
    const scrollOffset = $messages.scrollTop + visibleHeight;

    if(containerHeight - newMessageHeight <= scrollOffset){
        $messages.scrollTop = $messages.scrollHeight;
    }
}

socket.on('message', (message) => {
    //rendering the template with the mustache library loaded in the html file .
    const html = Mustache.render(messageTemplate, {
        username: message.username,
        templateMessage: message.text,
        createdAt: moment(message.createdAt).format('h:mm a'),
    });
    $messages.insertAdjacentHTML('beforeend', html);
    autoScroll();
});

socket.on('locationMessage', (message) => {
    //rendering our location template.
    const html = Mustache.render(locationMessageTemplate, {
        username: message.username,
        url: message.url,
        createdAt: moment(message.createdAt).format('h:mm a')
    });
    $messages.insertAdjacentHTML('beforeend', html);
    autoScroll();
});

socket.on('roomData', ({room, users}) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    });
    document.querySelector('#sidebar').innerHTML = html
});

$messageForm.addEventListener('submit', (event) => {
    event.preventDefault();
    //disabbling the button once it has been submitted.
    $messageFormButton.setAttribute('disabled', 'disabled');

    const message = event.target.elements.message.value;

    console.log('message is', message);
    socket.emit('sendMessage', message, (error) => { //callback function for acknowledgement.
        //re-enabling the button
        $messageFormButton.removeAttribute('disabled');
        //clearing the input in the field.
        $messageFormInput.value = '';
        //setting focus back to the input field-cursor goes back to input field.
        $messageFormInput.focus();

        if (error) {
            return console.log(error);
        }
        console.log('The message was delivered!');
    });
});


//listening for the 'message' event from the server
socket.on('message', (eventMessage) => {
    console.log(eventMessage);
});

document.querySelector('#sendLocation').addEventListener('click', () => {
    console.log('send location button clicked.');

    if (!navigator.geolocation) {
        return alert('Geolocation is not supported by your browser.');
    }
    $sendLocationButton.setAttribute('disabled', 'disabled');

    navigator.geolocation.getCurrentPosition((position) => {
        socket.emit('sendLocation', {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
        }, (error) => {
            $sendLocationButton.removeAttribute('disabled');
            if (error) {
                return console.log(error);
            }
            console.log('Location was sent');
        });
    });
});

//once joined the chatpage,emit an event contiaing the room and username data.
socket.emit('join', {username, room}, (error) => {
    if (error) {
        alert(error);
        //redirecting the user.
        location.href = '/'
    }
})
