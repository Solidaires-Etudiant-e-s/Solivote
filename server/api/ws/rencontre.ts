export default defineWebSocketHandler({
    open(peer) {
        peer.subscribe('update')
    },
    close(peer) {
        peer.unsubscribe('update')
    },

    message(peer) {
        peer.publish('update', "")
    },

    error(peer, error) {
        console.log("[ws] error", peer, error);
    },
});