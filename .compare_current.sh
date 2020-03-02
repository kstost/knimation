#!/bin/bash

# 쉘스크립트 괜찮은 문서
# https://www.lesstif.com/pages/viewpage.action?pageId=26083916

# 사용법
# source .compare_current.sh 0
# 이라고 하면 현재 프로젝트랑 깃헙자료중 0번째(첫번째) 커밋과 비교

# source .compare_current.sh 1
# 이라고 하면 현재 프로젝트랑 깃헙자료중 1번째(두번째) 커밋과 비교

if [ "$#" -eq 1 ]; then
    python3 .prepare_diff_source.py kstost $(basename `pwd`) `pwd` $1
fi

if [ "$#" -eq 2 ]; then
    python3 .prepare_diff_source.py kstost $(basename `pwd`) $1 `expr $1 + $2`
fi
