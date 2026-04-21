#!/usr/bin/env python3
import os
import sys

target_path = r'c:\Users\marlon.villarama\OneDrive - Datacom\Documents\DEV\LAB\sc-ai-002\src\FileCabinet\SuiteScripts\Collections'

try:
    os.makedirs(target_path, exist_ok=True)
    print(f'✓ Directory created successfully')
    print(f'Path: {target_path}')
    
    if os.path.isdir(target_path):
        print('✓ Directory verified - it exists')
    else:
        print('✗ Directory verification failed')
        sys.exit(1)
except Exception as err:
    print(f'Error creating directory: {err}')
    sys.exit(1)
