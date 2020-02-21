#!/bin/bash




if [ "$#" -eq 1 ]; then
    python prepare_diff_source.py find $1
fi
