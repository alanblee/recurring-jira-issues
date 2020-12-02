require("dotenv").config();
const { Reshuffle, CronConnector } = require("reshuffle");
const { JiraConnector } = require("reshuffle-jira-connector");

(async () => {
  const app = new Reshuffle();
  // Cron config
  const cronConnector = new CronConnector(app);
  // Jira Config
  const jira = new JiraConnector(app, {
    host: process.env.JIRA_HOST,
    protocol: process.env.JIRA_PROTOCOL,
    username: process.env.JIRA_USERNAME,
    password: process.env.JIRA_TOKEN,
    baseURL: process.env.RUNTIME_BASE_URL,
  });

  // const { projectId, issueTypeId } = await (async () => {
  //   const project = await jira.sdk().getProject("LEELEE");
  //   return {
  //     projectId: project.id,
  //     issueTypeId: project.issueTypes[0].id,
  //   };
  // })();
  const project = await jira.sdk().getProject("LEELEE");
  const { id: projectId, issueTypeId = project.issueTypes[0].id } = project;

  const checkIssues = async (id = "") => {
    const boardIssues = await jira.sdk().getIssuesForBoard(1);
    for (const issue of boardIssues.issues) {
      const { fields } = issue;
      if (fields.summary === "Recurring Issue" || id) {
        return true;
      }
    }
    return false;
  };

  let latestId;

  cronConnector.on({ expression: "1 * * * * *" }, async (event, app) => {
    const foundIssue = await checkIssues(latestId);
    if (!foundIssue) {
      const newIssue = {
        fields: {
          project: { id: projectId },
          issuetype: { id: issueTypeId },
          summary: "Recurring Issue",
          description: "Recurring Issue - Every 1 minute",
        },
      };
      const issue = await jira.sdk().addNewIssue(newIssue);
      latestId = issue.id;
      console.log("Issue created");
    } else {
      console.log("Issue already exists");
    }
  });
  app.start(8000);
})().catch(console.error);
