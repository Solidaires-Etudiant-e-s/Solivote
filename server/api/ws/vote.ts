export default defineWebSocketHandler({
    open(peer) {
        peer.subscribe('update')
    },
    close(peer) {
        peer.unsubscribe('update')
    },

    message(peer, message) {
        if (message.text() === "vote") {
            peer.publish('update', "vote")
        } else if (message.text() === "current") {
            peer.publish('update', "current")
        }
    },

    error(peer, error) {
        console.log("[ws] error", peer, error);
    },
});