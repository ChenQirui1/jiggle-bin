##Too be added
import sys
import os
AI_folder = os.path.split(os.path.split(__file__)[0])[0]+"\AI"
sys.path.insert(1,AI_folder)
import inference as AI


print(AI.import_test())


##test = input()
