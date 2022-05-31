const mineBlocks = async function (numberOfBlocks) {
    while (numberOfBlocks > 0) {
        numberOfBlocks--;
        await network.provider.request({
            method: "evm_mine",
            params: [],
        });
    }
};

module.exports = { mineBlocks };