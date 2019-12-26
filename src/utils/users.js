const users = []

//addUser, removeUser,getUser,getUsersInRoom

const addUser = ({id, username, room}) => {
    //Clean the data.
    username = username.trim().toLowerCase();
    room = room.trim().toLowerCase();

    //validate the data
    if (!username || !room) {
        return {
            error: "Both Username and Room are required"
        }
    }
    //make sure that the user in that room is unique
    //check for existing user.
    const existingUser = users.find((user) => {
        return user.room === room && user.username === username;
    });
    if (existingUser) {
        return {
            error: "Username is already in the room"
        }
    }
    //storing  the user-all previous conditions have been met.
    const user = {id, username, room}
    users.push(user); //adding the user to the list of users.
    //things went well so instead of error we will return the added user.
    return {user}
}

const removeUser = (id) => {
    const index = users.findIndex((user) => user.id === id)

    if (index !== -1) { //if we found a match
        return users.splice(index, 1)[0] //remove the user using the index
    }
}

const getUser = (id) => {
    return users.find((user) => user.id === id);
}

const getUsersInRoom = (room)=>{
    room = room.trim().toLowerCase(); //data sanitaization first
    return users.filter((user)=>user.room === room);
}

module.exports = {
    addUser,
    removeUser,
    getUser,
    getUsersInRoom,
}
