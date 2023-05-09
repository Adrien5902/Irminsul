Dim WinScriptHost
Set WinScriptHost = CreateObject("WScript.Shell")
WinScriptHost.Run Chr(34) & "C:/Users/adrie/Desktop/Irminsul/start.bat" & Chr(34), 0
Set WinScriptHost = Nothing