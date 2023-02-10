const axios = require("axios");
const { getRecentBatches } = require("../dao/jobsStatusDAO");
const { getUpcomingJobs } = require("../dao/jobsDAO");

const User = require("../models/user");


const homeController = {
  getHome: async (req, res) => {

    const WARNING_THRESHOLD_MINUTES = 15; //Warning if the target !== processed and gap is of 15 minutes
    const NUMBER_RECENT_JOBS = 100; // Last 100 Jobs
    const UPCOMING_JOB_LIMIT_IN_SECONDS = 18000; // Upcoming Jobs in next 5 hours 
    const url = `${process.env.API_CLIENT}/clients?id=-1`;
    const clients = (await axios.get(url)).data;

    const jobs = await getRecentBatches(NUMBER_RECENT_JOBS);
    const upcomingJobs = await getUpcomingJobs(UPCOMING_JOB_LIMIT_IN_SECONDS);


    res.render("home/home.pug", {
      title: "Home",
      clients: clients,
      jobs,
      upcomingJobs,
      numJobs: NUMBER_RECENT_JOBS,
      warningMinutes: WARNING_THRESHOLD_MINUTES
    });
  }
};

module.exports = homeController;
