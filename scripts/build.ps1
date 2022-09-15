$name = ''
$config = 'dev'
$deleteDist = $true
$positionalArgsReaded = 0

for ($i = 0; $i -lt $args.Length; $i++) {
    $arg = $args[$i].ToString()
    
    if ($name -eq 'config') {
        $config = $arg
        $name = ''
    } else {
        if ($arg -eq '--config' -or $arg -eq '-c') {
            $name = 'config'
        } elseif ($arg -eq '--retrainDist') {
            $deleteDist = $false
        } else {
            if ($arg.StartsWith('-') -and !$arg.StartsWith('--')) {
                if ($arg.Contains('d')) { $deleteDist = $false }
            } else {
                if ($positionalArgsReaded -eq 0) {
                    $config = $arg
                }

                $positionalArgsReaded++
            }
        }
    }
}

if ($deleteDist -and (Test-Path dist)) {
    Remove-Item dist -Recurse
}

npx tsc -p "tsconfig.$config.json"
