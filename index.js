require("dotenv").config();
const { Reshuffle, CronConnector } = require("reshuffle");
const { JiraConnector } = require("reshuffle-jira-connector");

(async () => {
  const app = new Reshuffle();
  // Cront config
  const cronConnector = new CronConnector(app);
  // Jira Config
  const jira = new JiraConnector(app, {
    host: process.env.JIRA_HOST,
    protocol: process.env.JIRA_PROTOCOL,
    username: process.env.JIRA_USERNAME,
    password: process.env.JIRA_TOKEN,
    baseURL: process.env.RUNTIME_BASE_URL,
  });

  const getIDs = async () => {
    const project = await jira.sdk().getProject("LEELEE");
    return {
      projectId: project.id,
      issueTypeId: project.issueTypes[0].id,
    };
  };

  const checkIssues = async (num = 0) => {
    const boardIssues = await jira.sdk().getIssuesForBoard(1);
    // console.log(boardIssues.issues[0]);
    for (const issue of boardIssues.issues) {
      const { fields } = issue;
      if (fields.summary === "Recurring Issue") {
        return true;
      }
    }
    return false;
  };
  const found = await checkIssues();
  // console.log(found);
  let number = 0;
  cronConnector.on({ expression: "1 * * * * *" }, async (event, app) => {
    // look for the issue summary, keep note of it if its there.
    // if not, create new issue with same summary and keep note of its id
    // get all the issues from the board
    const found = await checkIssues(number);
    const { projectId, issueTypeId } = await getIDs();
    if (!found) {
      // if not found, then create a new
      const newIssue = {
        fields: {
          project: { id: projectId },
          issuetype: { id: issueTypeId },
          summary: "Recurring Issue",
          description: "Recurring Issue - Every 1 minute",
        },
      };
      const issue = await jira.sdk().addNewIssue(newIssue);
      console.log(issue);
    } else {
      console.log("Issue already exists");
    }
  });
  app.start(8000);
})().catch(console.error);
