# -*- coding: utf-8 -*-
import os, sys, hashlib, re, json, dateutil.parser, pytz
# sudo pip3 install python-dateutil
# sudo pip3 install pytz
local_timezone = pytz.timezone('Asia/Seoul')

def is_safe_name(fn): #qq
	ddfe = fn.find('"') == -1 and fn.find("'") == -1 and fn.find("`") == -1
	if not ddfe:
		print("WRONG NAME: "+fn)
	return ddfe

def copy_itm(pl1, dff, rrr=False): #qq
	rr = ''
	if rrr:
		rr = '-R'
	if is_safe_name(pl1) and is_safe_name(dff):
		shell_exec('cp '+rr+' "'+pl1+'" "'+dff+'"')

def pull_and_get_commithashes(path_, github_id, project_id): #qq
	ddd = []
	if is_safe_name(path_) and is_safe_name(github_id) and is_safe_name(project_id):
		code = ""
		code += 'cd "'+path_+'";'
		code += 'git clone "https://github.com/'+github_id+'/'+project_id+'.git/";'
		code += "cd `ls`; git config pager.diff false; git config --global core.pager cat; git log | grep '^commit';"
		ddd = shell_exec(code).split('\n')
	return ddd

def getHomePath(): #qq
	return shell_exec('cd ~;pwd').strip()

def rmItem(path): #qq
	if is_safe_name(path):
		shell_exec('rm -rf "'+path+'"')

def genRandom(): #qq
	return shell_exec("openssl rand -base64 32 | md5").strip()

def list_files(compare_dir): #qq
	ddd = []
	if is_safe_name(compare_dir):
		ddd = shell_exec('ls "'+compare_dir+'"').strip().split('\n')
	if len(ddd) == 1 and ddd[0] == '':
		return []
	return ddd

def list_empty_dir(compare_dir): #qq
	ddd = []
	if is_safe_name(compare_dir):
		ddd = shell_exec('find "'+compare_dir+'" -type d -empty').strip().split('\n')
	if len(ddd) == 1 and ddd[0] == '':
		return []
	return ddd

def git_checkout(path, hashkey): #qq
	if is_safe_name(path) and is_safe_name(hashkey):
		shell_exec('cd "'+path+'";git checkout "'+hashkey+'"')

def moveItm(bpp, cdc, path=''): #qq
	if is_safe_name(bpp) and is_safe_name(cdc):
		if len(path) > 0:
			if is_safe_name(path):
				shell_exec('cd "'+path+'";mv "'+bpp+'" "'+cdc+'"')
		else:
			shell_exec('mv "'+bpp+'" "'+cdc+'"')

def shell_exec(cmd):
	cmd_ = os.popen(cmd)
	result = ''
	if cmd_:
		result = cmd_.read()
		cmd_.close()
	return result.strip()

def is_dir(path):
	return os.path.isdir(path)

def is_file(path):
	return os.path.isfile(path)

def md5file(fname):
   if not is_file(fname):
	   return None
   hash_md5 = hashlib.md5()
   size_ = 128 * hash_md5.block_size
   with open(fname, "rb") as f:
      for chunk in iter(lambda: f.read(size_), b""):
         hash_md5.update(chunk)
   return hash_md5.hexdigest()

def get_script_name():
	return sys.argv[0]

def genPath(desirePath):
   try:
      os.makedirs(desirePath)
   except Exception as e:
      pass

def is_num(val):
	try:
		int(val)
		return True
	except Exception as e:
		return False

def compare_two_sources(compare_dir, nMode=False):
	compare_dir = os.path.abspath(compare_dir)+'/'
	exclude = getExclude()
	if is_dir(compare_dir):
		fde = list_files(compare_dir)
		if False:
			for nm in fde:
				print(nm)
		if len(fde) == 2:
			cnt = 0
			tail = '_'
			if not nMode:
				tail += genRandom()
			for nn in fde:
				scan_path = compare_dir+nn
				for root, dirs, files in os.walk(scan_path):
					for file in files:
						filepath = str(root+'/'+file)
						pppth = filepath[len(scan_path):len(filepath)]
						nonof = False
						for exitm in exclude:
							if re.compile(exitm).match(pppth):
								nonof = True
								break
						if not nonof:
							pth1 = (compare_dir+fde[cnt])
							pth2 = (compare_dir+fde[0])
							if cnt == 0:
								pth2 = (compare_dir+fde[cnt+1])
							pl1 = pth1+pppth
							pl2 = pth2+pppth
							oo_p1=pth1+tail+'/'
							if not is_dir(oo_p1):
								genPath(oo_p1)
							md1 = md5file(pl1)
							md2 = md5file(pl2)
							if not (md1 and md2 and (md1==md2)):
								dff = oo_p1+(pppth.replace('/','／'))
								copy_itm(pl1, dff)
				cnt+=1

def getGithubCredential():
	path = getHomePath()+'/.github_api.token'
	if is_file(path):
		return shell_exec('cat "'+path+'"').strip()
	else:
		return ''
def getExclude():
	path = './.exclude.json'
	if is_file(path):
		return json.loads(shell_exec('cat "'+path+'"').strip())
	else:
		return []

def iso8601_convert(td):
	date = dateutil.parser.parse(td)
	local_date = date.replace(tzinfo=pytz.utc).astimezone(local_timezone)
	return str(local_date.isoformat()).replace('T', ' ').split('+')[0]

def get_commits_list(owner, repo):
	rte = []
	gcre = getGithubCredential()
	if len(gcre) > 0 and (is_safe_name(owner) and is_safe_name(repo)):
		dvd = json.loads(shell_exec("curl -s 'https://api.github.com/repos/"+owner+"/"+repo+"/commits' -H 'Authorization: token "+gcre+"' --compressed"))
		for ii in dvd:
			# print  + ' '+ ii['sha']
			rte.append({
				'time' : iso8601_convert(ii['commit']['committer']['date']),
				'sha' : ii['sha']
			})
	return rte

##==============

def get_project_id(): #OKK
	project_id = shell_exec('pwd').strip().split('/')
	project_id = project_id[-1]
	return project_id

def get_garc_path(): #OKK
	ppp = (shell_exec('cd ..; pwd').strip()) + '/.git_archives'
	genPath(ppp)
	return ppp

def save_archive(sourcepath, mKey): #OKK
	project_id = get_project_id()
	if len(mKey) >= 7 and is_dir(sourcepath) and is_dir(sourcepath+'/'+project_id) and len(project_id) > 0:
		mKey = mKey[:7]
		ggp = get_garc_path()
		cfilename = ggp+'/'+project_id+'.'+mKey+'.tgz'
		shell_exec("cd "+sourcepath+"; tar cfpz "+cfilename+" "+project_id)
		if is_file(cfilename):
			hash_ = md5file(cfilename)
			nfilename = ggp+'/'+project_id+'.'+mKey+'.'+hash_+'.tgz'
			shell_exec('mv '+cfilename+' '+nfilename)

def get_arc_filename(kks): #OKK
	project_id = get_project_id()
	if not len(kks) >= 7:
		return ''
	for vsf in list_files(get_garc_path()):
		if vsf.find(project_id+'.'+(kks[:7])+'.') == 0:
			return vsf
	return ''

def get_arcfile_with_hash(github_id, project_id, kks): #OKK
	arc = get_arc_filename(kks)
	if len(arc) > 0:
		return arc
	else:
		path_ = getHomePath()+'/.'+genRandom()+'/'
		genPath(path_)
		pull_and_get_commithashes(path_, github_id, project_id)
		git_checkout(path_+'/'+project_id, kks)
		rmItem(path_+'/'+project_id+"/.git") ## PHYSic
		save_archive(path_, kks)
		return get_arc_filename(kks)

def get_coms(github_id, project_id): #OKK
	newlist = []
	for ivj in get_commits_list(github_id, project_id):
		newlist.append(str('commit '+ivj['sha']))
	return newlist

##========================

# -------------------------------------
# $ git credential-osxkeychain erase
# host=github.com
# protocol=https
# <press return>
# -------------------------------------
def remove_exclude_items():
	exclude = getExclude()
	scan_path = '.'
	for root, dirs, files in os.walk(scan_path):
		for file in files:
			filepath = (str(root+'/'+file))
			pppth = (filepath[len(scan_path):len(filepath)])
			nonof = False
			for exitm in exclude:
				if re.compile(exitm).match(pppth):
					nonof = True
					break
			tdt = '.'+pppth
			if nonof and is_file(tdt):
				rmItem(tdt)
	while len(list_empty_dir('.')) > 0:
		shell_exec("find . -type d -empty -exec rm -rf '{}' \; 2>/dev/null")

if len(sys.argv) == 3:
	if sys.argv[1] == 'find':
		keyword = sys.argv[2]
		if is_safe_name(keyword):
			result = shell_exec("grep -rn './' -e \""+keyword+"\"").strip().split('\n')
			ffe = {}
			for line in result:
				if line.find(':') > -1:
					fnma = os.path.abspath(line.split(':')[0])
					ffe[fnma] = fnma
			print('\n'*100)
			print('-'*80)
			print('\n'*2)

			linemax = 0
			lenlen = 0
			for line in ffe:
				lenlen = len(line)
				if linemax < lenlen:
					linemax = lenlen

			addstr = (' '*(lenlen * 2))

			for line in ffe:
				print((line+addstr)[0:linemax] + (' '*3) + (line.split('/')[-1]))
				# print ''
			print('\n'*2)
		else:
			print('Your request is refused for the keyword includes some special characters')
		sys.exit()
if len(sys.argv) == 2:
	if sys.argv[1] == 'mooo':
		hp = getHomePath()
		ddf = shell_exec('ls -a1 '+hp).split('\n')
		ddf.sort()
		for ll in ddf:
			if len(ll) == 33 and ll[0] == '.':
				print(hp+'/'+ll)
				rmItem(hp+'/'+ll)

	if sys.argv[1] == 'commiting':
		rest = shell_exec('git add .; git commit -m "fixed"; git push -u origin master;')
		mKey = ''
		rest = rest.strip().split('\n')
		if len(rest) > 0:
			masterkey = rest[0]
			masterkey = masterkey.replace('[', ' ')
			masterkey = masterkey.replace(']', ' ')
			masterkey = masterkey.strip().split(' ')
			if len(masterkey) == 4:
				mKey = masterkey[1].strip()
		if len(mKey) == 7:
			#OKK
			project_id = get_project_id()
			path_ = getHomePath()+'/.'+genRandom()+'/'
			genPath(path_)
			code_ = shell_exec('cd ..; pwd').strip()+'/'+project_id
			if is_dir(path_) and is_dir(code_):
				copy_itm(code_, path_, True)
			if is_dir(path_+project_id):
				shell_exec('rm -rf '+path_+project_id+'/.git')
				save_archive(path_, mKey)
			rmItem(path_)
		sys.exit()

	if sys.argv[1] == 'remove_exclude':
		# python3 .prepare_diff_source.py remove_exclude
		remove_exclude_items()
		sys.exit()

if len(sys.argv) == 4:
	if sys.argv[1] == 'list':
		print('-' * 80)
		if getGithubCredential() == '':
			print('You should place .github_api.token to ~/ and put your github api token string into this file')
		else:
			dnt = get_commits_list(sys.argv[2], sys.argv[3])
			cnt = 0
			for dd in dnt:
				print(((' '*10)+str(cnt))[-4:] + ' : ' + dd['time'] + ' ' + dd['sha'])
				cnt+=1
		print('-' * 80)
	sys.exit()

if len(sys.argv) == 2:
	path = os.path.abspath(sys.argv[1])
	if is_dir(path):
		compare_two_sources(path)
	sys.exit()

current_path = getHomePath()
compare_dir = current_path+'/Downloads/GITHUB_PROJECT_COMPARE/'
if len(sys.argv) >= 5:
	github_id = sys.argv[1]
	if is_num(sys.argv[3]):
		compare_lst = [int(sys.argv[3]),int(sys.argv[4])]
		compare_local = False
	else:
		compare_lst = [sys.argv[3],int(sys.argv[4])]
		compare_local = os.path.abspath(sys.argv[3])
		if not is_dir(compare_local):
			compare_lst = [0,int(sys.argv[4])]
			compare_local = False

	project_id = sys.argv[2]

	list_ = get_coms(github_id, project_id)

	rmItem(compare_dir)
	genPath(compare_dir)
	cnt = 0
	ffwe = compare_lst
	if not is_num(ffwe[0]):
		ffwe = [0, ffwe[1]]
	for no in ffwe:
		if len(list_) > no and list_[no].find(' ') > -1:
			rmItem(get_garc_path()+'/'+project_id)
			cnt += 1
			kks = list_[no].split(' ')[1]
			afile = get_arcfile_with_hash(github_id, project_id, kks)
			if len(afile) > 0:
				checksum_name = project_id+'.'+(kks[:7])+'.'+md5file(get_garc_path()+'/'+afile)+'.tgz'
				if checksum_name == afile:
					shell_exec("cd "+get_garc_path()+"; tar xfpz "+afile)
					moveItm(get_garc_path()+'/'+project_id, compare_dir+"/"+str(cnt))

	cl = '1'
	cdc = compare_dir+'/'+cl
	if compare_local and is_dir(compare_local) and is_dir(cdc):
		rmItem(cdc)
		copy_itm(compare_local, cdc, True)		
		rmItem(cdc+'/.git')

	if cnt < 2:
		rmItem(compare_dir)
		print('-'*80)
		print('Index number of this project is out of range')
		print('-'*80)
	else:
		trm = 'trimmed_'
		compare_two_sources(compare_dir, True)
		for no in list_files(compare_dir):
			old_name = None
			new_name = None
			if no.find('_') != -1:
				old_name = no
				new_name = trm+''+(no.replace('_',''))+'_'
			else:
				old_name = no
				new_name = 'rawdata_'+no+'_'
			if old_name and new_name:
				moveItm(old_name, new_name, compare_dir)
		print('-'*80)
		print('Files are downloaded on '+compare_dir+'\n')
		diff_file_count = 0
		for no in list_files(compare_dir):
			drnn = compare_dir+no
			print(drnn)
			if no.find(trm) > -1 and is_dir(drnn):
				diff_file_count += len(list_files(drnn))
		print('-'*80)
		if diff_file_count == 0:
			print('\n'*100)
			print('NOTHING DIFFERENT')
			print('\n'*3)
else:
	print('-'*80)
	print('python3 '+get_script_name()+' github_account_id project_id commit_number commit_number')
	print('')
	print('github_account_id: github account id')
	print('project_id: project name')
	print('commit_number: if you give 0 then it means the first one of all commits')
	print('commit_number: if you give 1 then it means the second one of all commits')
	print('')
	print('[Usage]')
	print('1. place '+get_script_name()+' file on your pc')
	print('2. turn on terminal app and type below')
	print('   python3 '+get_script_name()+' kstost PrepareDiffSource 0 1')
	print('')
	print('[How to compare with local]')
	print('   python3 '+get_script_name()+' kstost PrepareDiffSource /Users/kstost/Downloads/project 1')
	print('-'*80)
