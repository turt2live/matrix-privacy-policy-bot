import { AutojoinRoomsMixin, MatrixClient, SimpleRetryJoinStrategy } from "matrix-bot-sdk";
import config from "./config";
import { LogService } from "matrix-js-snippets";
import { LocalstorageStorageProvider } from "./LocalstorageStorageProvider";
import { setupGithub } from "./github";

LogService.configure(config.logging);
const storageProvider = new LocalstorageStorageProvider("./storage");
const client = new MatrixClient(config.homeserverUrl, config.asToken, storageProvider);

client.impersonateUserId(config.userId);

AutojoinRoomsMixin.setupOnClient(client);
client.setJoinStrategy(new SimpleRetryJoinStrategy());

setupGithub(client);

client.doRequest("POST", "/_matrix/client/r0/register", null, {
    type: "m.login.application_service",
    username: config.userId.substring(1, config.userId.indexOf(':')),
}).then(() => LogService.info("index", "Registered user")).catch(err => {
    LogService.verbose("index", err);
    LogService.warn("index", "There was a problem registering the user. This is usually okay.");
}).then(() => client.start()).then(() => LogService.info("index", "Privacy policy bot started!"));
