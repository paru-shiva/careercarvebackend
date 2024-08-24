import express from "express";
import mysql from "mysql2/promise";
import cors from "cors";
const app = express();
app.use(express.json());
app.use(cors());

const connection = await mysql.createConnection({
  host: "bujtuwkrt3getswhsi8t-mysql.services.clever-cloud.com",
  user: "uy5bvzwclj463gnm",
  password: "FPKKauQCTP3mwKY6hFvL",
  database: "bujtuwkrt3getswhsi8t",
});

/*
try {
  const [results] = await connection.query("SELECT * FROM `sample`");
  console.log(results);
} catch (err) {
  console.log(err);
}
*/

app.get("/", (req, res) => {
  res.send("Home Route");
});

app.get("/get-roles", async (req, res) => {
  try {
    const [results] = await connection.query("SELECT DISTINCT role FROM roles");
    res.send(results);
  } catch (err) {
    console.log(err);
  }
});

app.post("/set-mentor", async (req, res) => {
  const { mentor, session } = req.body;

  try {
    const [results] = await connection.query(
      `SELECT * FROM mentors WHERE TIMEDIFF(end_time, todays_endtime) > "00:29:00" AND mentor_id = ${mentor}`
    );
    if (results.length === 0) {
      res.send({ msg: "mentor not available" });
    }
  } catch (err) {
    console.log(err);
  }

  try {
    const [results] = await connection.query(
      `UPDATE mentors SET todays_endtime = ADDTIME(todays_endtime, '${session}') WHERE mentor_id = ${mentor}`
    );
    console.log(results);

    res.send({ msg: "added successfully" });
  } catch (err) {
    console.log(err);
  }
});

app.get("/get-allmentors", async (req, res) => {
  try {
    const [results] = await connection.query(
      "SELECT * FROM mentors LEFT JOIN roles ON mentors.mentor_id = roles.mentor_id"
    );
    res.send(results);
  } catch (err) {
    console.log(err);
  }
});

app.get("/get-rolementors/:id", async (req, res) => {
  const id = req.params.id;
  try {
    const [results] = await connection.query(
      `SELECT * FROM mentors LEFT JOIN roles ON mentors.mentor_id = roles.mentor_id WHERE roles.role = '${id}'`
    );
    res.send(results);
  } catch (err) {
    console.log(err);
  }
});

app.get("/get-default-mentor/:id", async (req, res) => {
  const role = req.params.id;
  try {
    let [results] = await connection.query(
      `SELECT mentors.end_time-mentors.todays_endtime as total_time, roles.role, mentors.todays_endtime, mentors.mentor_name, mentors.mentor_id FROM mentors LEFT JOIN roles on mentors.mentor_id = roles.mentor_id WHERE roles.role = "${role}" and mentors.premium = 0 and mentors.end_time-mentors.todays_endtime >= 3000 ORDER BY total_time DESC limit 1`
    );
    if (results.length == 0) {
      try {
        let [results] = await connection.query(
          `SELECT mentors.end_time-mentors.todays_endtime as total_time, roles.role, mentors.todays_endtime, mentors.mentor_name, mentors.mentor_id FROM mentors LEFT JOIN roles on mentors.mentor_id = roles.mentor_id WHERE roles.role = "${role}" and mentors.premium = 1 and mentors.end_time-mentors.todays_endtime >= 3000 ORDER BY total_time DESC limit 1`
        );
        if (results.length == 0) {
          const dummbObj = {
            mentor_id: "",
            mentor_name: "",
            role: "",
            total_time: "",
          };
          results.push(dummbObj);
          results.push({ msg: "no members available for the selected role" });
          console.log("executed");

          res.send(results);
        }
        const available_total_time = results[0].total_time;
        results.push({ msg: "no members available, try a premium member" });
        if (available_total_time >= 6000) {
          const obj = { available_sessions: 3 };
          results.push(obj);
        } else if (available_total_time >= 4500) {
          const obj = { available_sessions: 2 };
          results.push(obj);
        } else if (available_total_time >= 3000) {
          const obj = { available_sessions: 1 };
          results.push(obj);
        }
        const todays_endtime_obj = {
          todays_endtime: results[0].todays_endtime,
        };
        results.push(todays_endtime_obj);
        res.send(results);
      } catch (err) {
        console.log(err);
      }
    }
    console.log(
      "ordinary mentor available, checking the time avialable",
      results[0].total_time
    );
    const available_total_time = results[0].total_time;
    results.push({ msg: "selected best member automatically" });
    if (available_total_time >= 6000) {
      const obj = { available_sessions: 3 };
      results.push(obj);
    } else if (available_total_time >= 4500) {
      const obj = { available_sessions: 2 };
      results.push(obj);
    } else if (available_total_time >= 3000) {
      const obj = { available_sessions: 1 };
      results.push(obj);
    }
    const todays_endtime_obj = { todays_endtime: results[0].todays_endtime };
    results.push(todays_endtime_obj);
    res.send(results);
  } catch (err) {
    console.log(err);
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
