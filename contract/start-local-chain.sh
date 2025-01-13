#!/bin/bash

# 检查状态文件是否存在
if [ -f "anvil_state.json" ]; then
    echo "Loading existing chain state..."
    anvil --load-state anvil_state.json
else
    echo "Starting fresh chain..."
    # 使用特定的助记词，这样每次地址都是一样的
    anvil --state anvil_state.json \
          --mnemonic "test test test test test test test test test test test junk" \
          --block-time 12
fi