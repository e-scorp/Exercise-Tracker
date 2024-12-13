import 'dotenv/config.js'
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { nanoid } from 'nanoid';

const app = express();

//middleware
app.use(cors())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.use(express.static('public'))

//In-memory database to store user and excercise data
const users = {}

app.get('/', (req, res) => {
  res.sendFile(process.cwd() + '/views/index.html')
});


//api to create a new user
app.post("/api/users", (req, res) => {
  const { username } = req.body

  if (!username) {
    return res.status(400).json({ error: "Username is required" });
  }

  const userId = nanoid(6)
  users[userId] = { username, log: [] }
  res.json({ username, _id: userId })

  //api to get all users
  app.get("/api/users", (req, res) => {
    const userList = Object.entries(users).map(([id, user]) => ({
      _id: id,
      username: user.username,
    }))
    res.json(userList)
  })

  //api to add an exercise
  app.post('/api/users/:_id/exercises', (req, res) => {
    const { _id } = req.params
    const { description, duration, date } = req.body
    if (!users[_id]) {
      return res.status(404).json({ error: 'User not found' })
    }
    if (!duration || !description) {
      return res.status(400).json({ error: "Description and duration are required" })
    }

    const exercise = {
      description,
      duration: parseInt(duration, 10),
      date: date ? new Date(date).toDateString() : new Date().toDateString(),
    }
    users[_id].log.push(exercise)

    res.json({
      username: users[_id].username,
      description: exercise.description,
      duration: exercise.duration,
      date: exercise.date,
      _id
    })
  })


  //api to get user's exercise log 
  app.get('/api/users/:_id/logs', (req, res) => {
    const { _id } = req.params
    const { from, to, limit } = req.query

    if (!users[_id]) {
      return res.status(404).json({ error: "User not found" })
    }
    let log = users[_id].log
    if (from) {
      const fromDate = new Date(from)
      log = log.filter((exercise) => new Date(exercise.date) >= fromDate)
    }

    if (to) {
      const toDate = new Date(to)
      log = log.filter((exercise) => new Date(exercise.date) <= toDate)
    }

    if (limit) {
      log = log.slice(0, parseInt(limit, 0))
    }

    res.json({
      username: users[_id].username,
      count: log.length,
      log,
    })
  })
})





const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
