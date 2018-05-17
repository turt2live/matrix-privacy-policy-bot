import * as http from "http";
import * as createHandler from "github-webhook-handler";
import { MatrixClient } from "matrix-bot-sdk";
import config from "./config";
import * as templateString from "string-template";
import { LogService } from "matrix-js-snippets";

export function setupGithub(client: MatrixClient) {
    const handler = (<any>createHandler)({path: config.listener.path, secret: config.listener.secret});

    http.createServer((request, response) => {
        handler(request, response, err => {
            response.statusCode = 404;
            response.end("not found");
        });
    }).listen(config.listener.port, config.listener.bind);

    handler.on("error", e => LogService.error("github", e));

    handler.on("ping", () => LogService.info("github", "Ping received"));
    handler.on("push", event => {
        if (!event.payload || !event.payload.repository || !event.payload.head_commit) return;
        if (event.payload.ref !== "refs/heads/" + config.listener.branch) {
            LogService.warn("github", "Received push event for an unwatched branch: " + event.payload.ref);
            return;
        }
        if (event.payload.repository.full_name !== config.listener.repoOwner + "/" + config.listener.repoName) {
            LogService.warn("github", "Received push event for an unwatched repository: " + event.payload.repository.full_name);
            return;
        }
        if (event.payload.head_commit.modified.indexOf(config.listener.file) === -1) {
            LogService.warn("github", "Received push, but the tracked file wasn't modified");
            return;
        }

        const compareUrl = event.payload.compare;
        const effectiveDate = event.payload.head_commit.message.split("\n")
            .filter(i => i.startsWith(config.listener.effectiveKeyword))
            .map(i => i.substring(config.listener.effectiveKeyword.length).trim())[0];
        if (!effectiveDate) {
            LogService.warn("github", "Received push, but the head_commit doesn't have an effective date");
            return;
        }

        const template = {compare_url: compareUrl, effective_date: effectiveDate};
        const htmlMessage = templateString(config.message.htmlTemplate, template);
        const textMessage = templateString(config.message.textTemplate, template);

        LogService.info("github", "Waiting " + config.message.delaySeconds + " seconds before posting a privacy policy change");
        setTimeout(config.message.delaySeconds * 1000, () => {
            LogService.info("github", "Posting message for change: " + JSON.stringify(template));
            client.getJoinedRooms().then(rooms => {
                return Promise.all(rooms.map(roomId => sendMessage(roomId, htmlMessage, textMessage, client)));
            }).then(() => LogService.info("github", "Privacy policy notification complete"));
        });
    });
}

function sendMessage(roomId: string, htmlMessage: string, textMessage: string, client: MatrixClient, attempt = 0) {
    if (attempt > 50) {
        LogService.error("github", "Failed to send privacy policy change notice into room: " + roomId);
        return Promise.resolve();
    }
    return client.sendMessage(roomId, {
        msgtype: "m.text",
        format: "org.matrix.custom.html",
        formatted_body: htmlMessage,
        body: textMessage,
    }).catch(err => {
        LogService.verbose("github", err);
        return sendMessage(roomId, htmlMessage, textMessage, client, attempt++);
    });
}