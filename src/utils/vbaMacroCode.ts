export const VBA_MAIN_MODULE_CODE = `' ========================================================================================
' KENYAN CBC ASSESSMENT AUTOMATION SUITE - COMPLETE VBA MACRO MODULE
' ========================================================================================
' Instructions:
' 1. In Excel, press Alt + F11 to open the VBA Editor.
' 2. Click Insert > Module, and paste this entire code block into Module1.
' 3. Save your workbook as an Excel Macro-Enabled Workbook (.xlsm).
' 4. All calculations, rankings, analysis grids, and top performer summaries will run automatically
'    without any cell formulas!
' ========================================================================================

Option Explicit

Sub RunAllCBCAutomations()
    Application.ScreenUpdating = False
    Application.Calculation = xlCalculationManual
    Application.DisplayAlerts = False
    
    On Error GoTo ErrorHandler
    
    ' 1. Process Analysis Sheet
    GenerateAnalysisReport
    
    ' 2. Process Best Performed Sheet
    GenerateBestPerformedReport
    
    ' 3. Auto-fit all columns and set A4 print properties
    FormatForA4Printing
    
    Application.Calculation = xlCalculationAutomatic
    Application.ScreenUpdating = True
    MsgBox "CBC Assessment Analysis and Reports Generated Successfully!", vbInformation, "CBC Exam Automation"
    Exit Sub

ErrorHandler:
    Application.Calculation = xlCalculationAutomatic
    Application.ScreenUpdating = True
    MsgBox "An error occurred during macro execution: " & Err.Description, vbCritical, "Macro Error"
End Sub

Sub GenerateAnalysisReport()
    Dim wsData As Worksheet, wsAnal As Worksheet, wsGrading As Worksheet
    Dim lastRow As Long, i As Long, j As Long
    Dim sn As Variant, sName As String, gender As String, school As String
    Dim mark As Double, points As Long, grade As String
    Dim totMarks As Double, totPoints As Long, tplGrade As String
    Dim hoiRemarks As String, classTeachRemarks As String
    
    Set wsData = ThisWorkbook.Sheets("Data Entry")
    Set wsAnal = ThisWorkbook.Sheets("Analysis")
    Set wsGrading = ThisWorkbook.Sheets("Grading Scale")
    
    lastRow = wsData.Cells(wsData.Rows.Count, "A").End(xlUp).Row
    If lastRow < 5 Then Exit Sub ' Assumes headers are on row 4, data starts row 5
    
    ' Clear Analysis Sheet formatting and contents below header
    wsAnal.Range("A5:Z1000").ClearContents
    wsAnal.Range("A5:Z1000").Font.Bold = False
    wsAnal.Range("A5:Z1000").Interior.ColorIndex = xlNone
    
    ' Copy headers if empty
    If wsAnal.Range("A4").Value = "" Then
        wsData.Range("A4:O4").Copy wsAnal.Range("A4")
        wsAnal.Range("P4").Value = "TOTAL MARKS"
        wsAnal.Range("Q4").Value = "TOTAL POINTS"
        wsAnal.Range("R4").Value = "T.PL"
        wsAnal.Range("S4").Value = "RANK"
        wsAnal.Range("T4").Value = "HOI REMARKS"
    End If
    
    Dim outRow As Long
    outRow = 5
    
    For i = 5 To lastRow
        sn = wsData.Cells(i, 1).Value
        If Trim(CStr(sn)) <> "" Then
            sName = wsData.Cells(i, 2).Value
            gender = UCase(Trim(wsData.Cells(i, 3).Value))
            school = wsData.Cells(i, 4).Value
            
            wsAnal.Cells(outRow, 1).Value = sn
            wsAnal.Cells(outRow, 2).Value = sName
            wsAnal.Cells(outRow, 3).Value = gender
            wsAnal.Cells(outRow, 4).Value = school
            
            totMarks = 0
            totPoints = 0
            
            ' Process 9 Learning Areas (Columns E to M: MATHS, ENG, KISWAHILI, SCIENCE, AGRIC, SST, CRE, CAS, PRETECH)
            For j = 5 To 13
                mark = Val(wsData.Cells(i, j).Value)
                totMarks = totMarks + mark
                
                ' Evaluate Grade and Points
                If mark >= 85 Then: grade = "EE1": points = 8
                ElseIf mark >= 73 Then: grade = "EE2": points = 7
                ElseIf mark >= 61 Then: grade = "ME1": points = 6
                ElseIf mark >= 50 Then: grade = "ME2": points = 5
                ElseIf mark >= 37 Then: grade = "AE1": points = 4
                ElseIf mark >= 25 Then: grade = "AE2": points = 3
                ElseIf mark >= 13 Then: grade = "BE1": points = 2
                Else: grade = "BE2": points = 1
                
                totPoints = totPoints + points
                
                ' Format as requested: [score   level] e.g. [23   BE1] in the same cell
                wsAnal.Cells(outRow, j).Value = CStr(mark) & "   " & grade
                wsAnal.Cells(outRow, j).HorizontalAlignment = xlLeft
            Next j
            
            ' Evaluate Overall T.PL from Total Points (out of 72)
            If totPoints >= 61 Then: tplGrade = "EE1": hoiRemarks = "Exceeding Expectations! Exceptional mastery."
            ElseIf totPoints >= 52 Then: tplGrade = "EE2": hoiRemarks = "Exceeding Expectations! Very commendable effort."
            ElseIf totPoints >= 43 Then: tplGrade = "ME1": hoiRemarks = "Meeting Expectations. Solid performance."
            ElseIf totPoints >= 36 Then: tplGrade = "ME2": hoiRemarks = "Meeting Expectations. Satisfactory work."
            ElseIf totPoints >= 26 Then: tplGrade = "AE1": hoiRemarks = "Approaching Expectations. Can do better."
            ElseIf totPoints >= 18 Then: tplGrade = "AE2": hoiRemarks = "Can do better. Better luck in the next exam."
            ElseIf totPoints >= 9 Then: tplGrade = "BE1": hoiRemarks = "Below Expectations. Needs immediate remedial support."
            Else: tplGrade = "BE2": hoiRemarks = "Below Expectations. Better luck in the next exam."
            
            wsAnal.Cells(outRow, 14).Value = totMarks
            wsAnal.Cells(outRow, 15).Value = totPoints
            wsAnal.Cells(outRow, 16).Value = tplGrade
            wsAnal.Cells(outRow, 18).Value = hoiRemarks
            
            outRow = outRow + 1
        End If
    Next i
    
    ' Perform Ranking by Total Points (Column O / 15), tie break by Total Marks (Column N / 14)
    Dim numStudents As Long
    numStudents = outRow - 5
    If numStudents > 0 Then
        Dim r As Long, r2 As Long
        Dim myPts As Long, myMarks As Double, rankCount As Long
        For r = 5 To outRow - 1
            myPts = Val(wsAnal.Cells(r, 15).Value)
            myMarks = Val(wsAnal.Cells(r, 14).Value)
            rankCount = 1
            For r2 = 5 To outRow - 1
                If r <> r2 Then
                    If Val(wsAnal.Cells(r2, 15).Value) > myPts Then
                        rankCount = rankCount + 1
                    ElseIf Val(wsAnal.Cells(r2, 15).Value) = myPts And Val(wsAnal.Cells(r2, 14).Value) > myMarks Then
                        rankCount = rankCount + 1
                    End If
                End If
            Next r2
            wsAnal.Cells(r, 17).Value = rankCount
        Next r
        
        ' Sort Analysis Sheet by Rank (Column Q / 17) Ascending
        wsAnal.Sort.SortFields.Clear
        wsAnal.Sort.SortFields.Add Key:=wsAnal.Range("Q5:Q" & (outRow - 1)), SortOn:=xlSortOnValues, Order:=xlAscending
        With wsAnal.Sort
            .SetRange wsAnal.Range("A4:T" & (outRow - 1))
            .Header = xlYes
            .MatchCase = False
            .Orientation = xlTopToBottom
            .Apply
        End With
    End If
End Sub

Sub GenerateBestPerformedReport()
    Dim wsAnal As Worksheet, wsBest As Worksheet, wsData As Worksheet
    Dim topCount As Long
    Set wsAnal = ThisWorkbook.Sheets("Analysis")
    Set wsBest = ThisWorkbook.Sheets("Best Performed")
    Set wsData = ThisWorkbook.Sheets("Data Entry")
    
    ' Read desired Top Performers Count from cell B2 in Data Entry (or default to 3)
    topCount = Val(wsData.Range("B2").Value)
    If topCount <= 0 Then topCount = 3
    
    wsBest.Cells.Clear
    wsBest.Columns("A:G").Font.Name = "Calibri"
    wsBest.Columns("A:G").Font.Size = 11
    
    Dim currRow As Long, i As Long, count As Long
    Dim lastAnalRow As Long
    lastAnalRow = wsAnal.Cells(wsAnal.Rows.Count, "A").End(xlUp).Row
    
    currRow = 2
    
    ' --- TABLE 1: TOP N STUDENTS OVERALL ---
    wsBest.Cells(currRow, 2).Value = "TOP " & topCount & " STUDENTS - OVERALL"
    wsBest.Cells(currRow, 2).Font.Bold = True
    wsBest.Range(wsBest.Cells(currRow, 2), wsBest.Cells(currRow, 7)).Merge
    wsBest.Range(wsBest.Cells(currRow, 2), wsBest.Cells(currRow, 7)).Interior.Color = RGB(0, 51, 102)
    wsBest.Range(wsBest.Cells(currRow, 2), wsBest.Cells(currRow, 7)).Font.Color = RGB(255, 255, 255)
    currRow = currRow + 1
    
    wsBest.Cells(currRow, 2).Value = "Rank"
    wsBest.Cells(currRow, 3).Value = "Name"
    wsBest.Cells(currRow, 4).Value = "Gender"
    wsBest.Cells(currRow, 5).Value = "School"
    wsBest.Cells(currRow, 6).Value = "Total Marks"
    wsBest.Cells(currRow, 7).Value = "Total Points"
    wsBest.Range(wsBest.Cells(currRow, 2), wsBest.Cells(currRow, 7)).Font.Bold = True
    wsBest.Range(wsBest.Cells(currRow, 2), wsBest.Cells(currRow, 7)).Interior.Color = RGB(220, 230, 242)
    currRow = currRow + 1
    
    count = 0
    For i = 5 To lastAnalRow
        If count < topCount Then
            wsBest.Cells(currRow, 2).Value = wsAnal.Cells(i, 17).Value ' Rank
            wsBest.Cells(currRow, 3).Value = wsAnal.Cells(i, 2).Value  ' Name
            wsBest.Cells(currRow, 4).Value = wsAnal.Cells(i, 3).Value  ' Gender
            wsBest.Cells(currRow, 5).Value = wsAnal.Cells(i, 4).Value  ' School
            wsBest.Cells(currRow, 6).Value = wsAnal.Cells(i, 14).Value ' Marks
            wsBest.Cells(currRow, 7).Value = wsAnal.Cells(i, 15).Value ' Points
            currRow = currRow + 1
            count = count + 1
        End If
    Next i
    
    ' Exactly at most 2 rows between tables as requested!
    currRow = currRow + 2
    
    ' --- TABLE 2: TOP N BOYS ---
    wsBest.Cells(currRow, 2).Value = "TOP " & topCount & " BOYS"
    wsBest.Cells(currRow, 2).Font.Bold = True
    wsBest.Range(wsBest.Cells(currRow, 2), wsBest.Cells(currRow, 7)).Merge
    wsBest.Range(wsBest.Cells(currRow, 2), wsBest.Cells(currRow, 7)).Interior.Color = RGB(31, 78, 121)
    wsBest.Range(wsBest.Cells(currRow, 2), wsBest.Cells(currRow, 7)).Font.Color = RGB(255, 255, 255)
    currRow = currRow + 1
    
    wsBest.Cells(currRow, 2).Value = "Rank"
    wsBest.Cells(currRow, 3).Value = "Name"
    wsBest.Cells(currRow, 4).Value = "Gender"
    wsBest.Cells(currRow, 5).Value = "School"
    wsBest.Cells(currRow, 6).Value = "Total Marks"
    wsBest.Cells(currRow, 7).Value = "Total Points"
    wsBest.Range(wsBest.Cells(currRow, 2), wsBest.Cells(currRow, 7)).Font.Bold = True
    wsBest.Range(wsBest.Cells(currRow, 2), wsBest.Cells(currRow, 7)).Interior.Color = RGB(220, 230, 242)
    currRow = currRow + 1
    
    count = 0
    For i = 5 To lastAnalRow
        If count < topCount And wsAnal.Cells(i, 3).Value = "M" Then
            wsBest.Cells(currRow, 2).Value = count + 1
            wsBest.Cells(currRow, 3).Value = wsAnal.Cells(i, 2).Value
            wsBest.Cells(currRow, 4).Value = "M"
            wsBest.Cells(currRow, 5).Value = wsAnal.Cells(i, 4).Value
            wsBest.Cells(currRow, 6).Value = wsAnal.Cells(i, 14).Value
            wsBest.Cells(currRow, 7).Value = wsAnal.Cells(i, 15).Value
            currRow = currRow + 1
            count = count + 1
        End If
    Next i
    
    currRow = currRow + 2
    
    ' --- TABLE 3: TOP N GIRLS ---
    wsBest.Cells(currRow, 2).Value = "TOP " & topCount & " GIRLS"
    wsBest.Cells(currRow, 2).Font.Bold = True
    wsBest.Range(wsBest.Cells(currRow, 2), wsBest.Cells(currRow, 7)).Merge
    wsBest.Range(wsBest.Cells(currRow, 2), wsBest.Cells(currRow, 7)).Interior.Color = RGB(128, 0, 64)
    wsBest.Range(wsBest.Cells(currRow, 2), wsBest.Cells(currRow, 7)).Font.Color = RGB(255, 255, 255)
    currRow = currRow + 1
    
    wsBest.Cells(currRow, 2).Value = "Rank"
    wsBest.Cells(currRow, 3).Value = "Name"
    wsBest.Cells(currRow, 4).Value = "Gender"
    wsBest.Cells(currRow, 5).Value = "School"
    wsBest.Cells(currRow, 6).Value = "Total Marks"
    wsBest.Cells(currRow, 7).Value = "Total Points"
    wsBest.Range(wsBest.Cells(currRow, 2), wsBest.Cells(currRow, 7)).Font.Bold = True
    wsBest.Range(wsBest.Cells(currRow, 2), wsBest.Cells(currRow, 7)).Interior.Color = RGB(242, 220, 230)
    currRow = currRow + 1
    
    count = 0
    For i = 5 To lastAnalRow
        If count < topCount And wsAnal.Cells(i, 3).Value = "F" Then
            wsBest.Cells(currRow, 2).Value = count + 1
            wsBest.Cells(currRow, 3).Value = wsAnal.Cells(i, 2).Value
            wsBest.Cells(currRow, 4).Value = "F"
            wsBest.Cells(currRow, 5).Value = wsAnal.Cells(i, 4).Value
            wsBest.Cells(currRow, 6).Value = wsAnal.Cells(i, 14).Value
            wsBest.Cells(currRow, 7).Value = wsAnal.Cells(i, 15).Value
            currRow = currRow + 1
            count = count + 1
        End If
    Next i
    
    currRow = currRow + 2
    
    ' --- TABLE 4: BEST PERFORMED LEARNING AREAS ---
    wsBest.Cells(currRow, 2).Value = "BEST PERFORMED LEARNING AREAS"
    wsBest.Cells(currRow, 2).Font.Bold = True
    wsBest.Range(wsBest.Cells(currRow, 2), wsBest.Cells(currRow, 6)).Merge
    wsBest.Range(wsBest.Cells(currRow, 2), wsBest.Cells(currRow, 6)).Interior.Color = RGB(0, 102, 51)
    wsBest.Range(wsBest.Cells(currRow, 2), wsBest.Cells(currRow, 6)).Font.Color = RGB(255, 255, 255)
    currRow = currRow + 1
    
    wsBest.Cells(currRow, 2).Value = "Learning Area"
    wsBest.Cells(currRow, 3).Value = "Mean Score"
    wsBest.Cells(currRow, 4).Value = "Best Performer"
    wsBest.Cells(currRow, 5).Value = "Highest Score"
    wsBest.Cells(currRow, 6).Value = "CBC Grade"
    wsBest.Range(wsBest.Cells(currRow, 2), wsBest.Cells(currRow, 6)).Font.Bold = True
    wsBest.Range(wsBest.Cells(currRow, 2), wsBest.Cells(currRow, 6)).Interior.Color = RGB(220, 242, 230)
    currRow = currRow + 1
    
    Dim subNames As Variant
    subNames = Array("MATHS", "ENG", "KISWAHILI", "SCIENCE", "AGRIC", "SST", "CRE", "CAS", "PRETECH")
    Dim colIdx As Variant
    colIdx = Array(5, 6, 7, 8, 9, 10, 11, 12, 13)
    
    Dim sIdx As Long, sumM As Double, maxM As Double, bestP As String, valM As Double
    Dim stCount As Long
    stCount = lastAnalRow - 4
    
    If stCount > 0 Then
        For sIdx = 0 To UBound(subNames)
            sumM = 0: maxM = 0: bestP = "-"
            For i = 5 To lastAnalRow
                valM = Val(Split(wsAnal.Cells(i, colIdx(sIdx)).Value, " ")(0))
                sumM = sumM + valM
                If valM > maxM Then
                    maxM = valM
                    bestP = wsAnal.Cells(i, 2).Value
                End If
            Next i
            
            Dim meanS As Double
            meanS = Round(sumM / stCount, 2)
            Dim mGrade As String
            If meanS >= 85 Then: mGrade = "EE1"
            ElseIf meanS >= 73 Then: mGrade = "EE2"
            ElseIf meanS >= 61 Then: mGrade = "ME1"
            ElseIf meanS >= 50 Then: mGrade = "ME2"
            ElseIf meanS >= 37 Then: mGrade = "AE1"
            ElseIf meanS >= 25 Then: mGrade = "AE2"
            ElseIf meanS >= 13 Then: mGrade = "BE1"
            Else: mGrade = "BE2"
            
            wsBest.Cells(currRow, 2).Value = subNames(sIdx)
            wsBest.Cells(currRow, 3).Value = meanS
            wsBest.Cells(currRow, 4).Value = bestP
            wsBest.Cells(currRow, 5).Value = maxM
            wsBest.Cells(currRow, 6).Value = mGrade
            currRow = currRow + 1
        Next sIdx
        
        ' Sort Best Performed Learning Areas by Mean Score descending
        Dim startSubRow As Long
        startSubRow = currRow - UBound(subNames) - 1
        wsBest.Range(wsBest.Cells(startSubRow, 2), wsBest.Cells(currRow - 1, 6)).Sort Key1:=wsBest.Cells(startSubRow, 3), Order1:=xlDescending, Header:=xlNo
    End If
    
    currRow = currRow + 2
    
    ' --- TABLE 5: OVERALL SUMMARY ---
    wsBest.Cells(currRow, 2).Value = "OVERALL SUMMARY"
    wsBest.Cells(currRow, 2).Font.Bold = True
    wsBest.Range(wsBest.Cells(currRow, 2), wsBest.Cells(currRow, 5)).Merge
    wsBest.Range(wsBest.Cells(currRow, 2), wsBest.Cells(currRow, 5)).Interior.Color = RGB(102, 102, 102)
    wsBest.Range(wsBest.Cells(currRow, 2), wsBest.Cells(currRow, 5)).Font.Color = RGB(255, 255, 255)
    currRow = currRow + 1
    
    wsBest.Cells(currRow, 2).Value = "Metric"
    wsBest.Cells(currRow, 3).Value = "Overall"
    wsBest.Cells(currRow, 4).Value = "Boys"
    wsBest.Cells(currRow, 5).Value = "Girls"
    wsBest.Range(wsBest.Cells(currRow, 2), wsBest.Cells(currRow, 5)).Font.Bold = True
    wsBest.Range(wsBest.Cells(currRow, 2), wsBest.Cells(currRow, 5)).Interior.Color = RGB(235, 235, 235)
    currRow = currRow + 1
    
    Dim boysC As Long, girlsC As Long, sumTotM As Double, sumTotP As Double
    Dim bTotM As Double, bTotP As Double, gTotM As Double, gTotP As Double
    Dim bestTotM As Double
    
    boysC = 0: girlsC = 0: sumTotM = 0: sumTotP = 0
    bTotM = 0: bTotP = 0: gTotM = 0: gTotP = 0: bestTotM = 0
    
    For i = 5 To lastAnalRow
        valM = Val(wsAnal.Cells(i, 14).Value)
        Dim valP As Double
        valP = Val(wsAnal.Cells(i, 15).Value)
        sumTotM = sumTotM + valM
        sumTotP = sumTotP + valP
        If valM > bestTotM Then bestTotM = valM
        
        If wsAnal.Cells(i, 3).Value = "M" Then
            boysC = boysC + 1
            bTotM = bTotM + valM
            bTotP = bTotP + valP
        Else
            girlsC = girlsC + 1
            gTotM = gTotM + valM
            gTotP = gTotP + valP
        End If
    Next i
    
    wsBest.Cells(currRow, 2).Value = "Total Students"
    wsBest.Cells(currRow, 3).Value = stCount
    wsBest.Cells(currRow, 4).Value = boysC
    wsBest.Cells(currRow, 5).Value = girlsC
    currRow = currRow + 1
    
    wsBest.Cells(currRow, 2).Value = "Mean Total Marks"
    wsBest.Cells(currRow, 3).Value = IIf(stCount > 0, Round(sumTotM / stCount, 2), 0)
    wsBest.Cells(currRow, 4).Value = IIf(boysC > 0, Round(bTotM / boysC, 2), 0)
    wsBest.Cells(currRow, 5).Value = IIf(girlsC > 0, Round(gTotM / girlsC, 2), 0)
    currRow = currRow + 1
    
    wsBest.Cells(currRow, 2).Value = "Best Total Marks"
    wsBest.Cells(currRow, 3).Value = bestTotM
    wsBest.Cells(currRow, 4).Value = "-"
    wsBest.Cells(currRow, 5).Value = "-"
    currRow = currRow + 1
    
    wsBest.Cells(currRow, 2).Value = "Mean Total Points"
    wsBest.Cells(currRow, 3).Value = IIf(stCount > 0, Round(sumTotP / stCount, 2), 0)
    wsBest.Cells(currRow, 4).Value = IIf(boysC > 0, Round(bTotP / boysC, 2), 0)
    wsBest.Cells(currRow, 5).Value = IIf(girlsC > 0, Round(gTotP / girlsC, 2), 0)
    
    wsBest.Columns("B:G").AutoFit
End Sub

Sub FormatForA4Printing()
    Dim ws As Worksheet
    For Each ws In ThisWorkbook.Worksheets
        If ws.Name = "Analysis" Or ws.Name = "Best Performed" Or ws.Name = "Report Cards" Then
            With ws.PageSetup
                .Orientation = IIf(ws.Name = "Analysis", xlLandscape, xlPortrait)
                .PaperSize = xlPaperA4
                .FitToPagesWide = 1
                .FitToPagesTall = False
                .Zoom = False
            End With
        End If
    Next ws
End Sub

Sub DuplicateClassSheet()
    Dim newName As String
    newName = InputBox("Enter new Class Name (e.g. Grade 7 Analysis):", "Next Class / Duplicate Analysis")
    If Trim(newName) <> "" Then
        ThisWorkbook.Sheets("Analysis").Copy After:=ThisWorkbook.Sheets(ThisWorkbook.Sheets.Count)
        ActiveSheet.Name = Left(newName, 31)
        MsgBox "Class Analysis duplicated as: " & ActiveSheet.Name, vbInformation
    End If
End Sub
`;

export const VBA_WORKBOOK_OPEN_CODE = `' ========================================================================================
' THISWORKBOOK MODULE - AUTO-RUN ON LOAD & DATA CHANGE
' Paste this code into the 'ThisWorkbook' object in VBA Editor
' ========================================================================================

Private Sub Workbook_Open()
    ' Automatically run calculations when the workbook opens
    RunAllCBCAutomations
End Sub

Private Sub Workbook_SheetChange(ByVal Sh As Object, ByVal Target As Range)
    ' If data entry changes, automatically re-run analysis and best performed reports
    If Sh.Name = "Data Entry" And Not Intersect(Target, Sh.Range("E5:M1000")) Is Nothing Then
        Application.EnableEvents = False
        RunAllCBCAutomations
        Application.EnableEvents = True
    End If
End Sub
`;
