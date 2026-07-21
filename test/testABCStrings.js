const testABCStrings = [
	`X:1\nT:Simple Tune\nM:4/4\nK:C\nC D E F|G A B c|`,
	`X:2\nT:With Lyrics\nM:3/4\nK:G\nG2 A B2 c | d3 d3 |\nw: Ho- ly Ho- ly | Lord God |`,
	`X:3\nT:With Gracenotes and Slurs\nM:2/4\nK:D\n{g}A2 (Bc) | d4 |`,
	`
X: 1
T: Cooley's
M: 4/4
L: 1/8
R: reel
K: Emin
|:D2|EB{c}BA B2 EB|~B2 AB dBAG|FDAD BDAD|FDAD dAFD|
EBBA B2 EB|B2 AB defg|afe^c dBAF|DEFD E2:|
|:gf|eB B2 efge|eB B2 gedB|A2 FA DAFA|A2 FA defg|
eB B2 eBgB|eB B2 defg|afe^c dBAF|DEFD E2:|
	`,
	`
X:1\nT: Untitled\nC:Author\nS: Copyright\nM:4/4\nL: 1 / 8\nQ:112\nR: rhythm\nK:C\n	
	`,
	`
X:1
T:Critter's Gone to Texas
M:4/4
L:1/8
Q:116
C:Paul Rosen
S:Copyright 2008, Paul Rosen
R:old time
K:C
ef|:"C"g2g2 a3a|ge3- e2 ef|g2g2 a2ag|"G7"f4-f2ff|f2ff d2dd|B2BB G4|
f2f2 edB2|1"C"c6ef:|2"C"c6cB[|:"Am"AE2E E2EE|GE2E E2EE|"G"D2DE DCB,2|"Am"A,2A,A, A,2A,A,|
"G"G,2B,2 D2E2|GABc d2dd|f2f2 edB2|1"C"c6cB:|2"C"c6ef||
	`,

	`
X: 1
T:Dancing Susan
C:Paul Rosen
S:Copyright 2005, Paul Rosen
M: 6 / 8
L: 1 / 8
Q: 112
R:Circus Jig
K: D
"D"dcd f2d | B2A F2A | "Em"BAG B2G | "A7"cBA c2A | "D"dcd f2d | B2A F2A | "G"B2c "A7"edc | "D"d3 d3:|
|: "B7"Bc ^ d Bcd | "E7"e2f ^ g3 | "A"a ^ ga bag | "A7"a2e c2e | "D"dcd f3 | "G"dcd g3 | "A7"B2c edc | "D"d3 d3:|
	T: Harmony(by Rya Martin)
"D"fef a2f | d2=cA2c | "Em"d = cB d2B | "A7"edc e2c | "D"fef a2f | d2=cA2c | "G"d2e "A7"gfe | "D"f3f3:|
|: "B7" ^ def def | "E7" ^ g2a b3 | "A"c'bc\`a d\`ac\`ab|"A7"c\`a2g e2g|"D"fef a2f|"G"bab d\`a2b|"A7"g2a gfe|"D"f3 f3:|
	`,
	`
X: 1
T: Money Lost
M: 3 / 4
L: 1 / 8
Q: 80
C: Paul Rosen
S: Copyright 2007, Paul Rosen
R: Klezmer
K: Dm
Ade |: "Dm"(f2d)e gf | "A7"e2 ^ c4 | "Gm"B >>^ c BA BG | "A"A3Ade | "Dm"(f2d)e gf | "A7"e2 ^ c4 |
	"Gm"A >> B "A7"AG FE | 1"Dm"D3Ade:| 2"Dm"D3DEF ||: "Gm"(G2D)E FG | "Dm"A2F4 | "Gm"B >> c "A7"BA BG |
	"Dm"A3 DEF | "Gm"(G2D)EFG | "Dm"A2F4 | "A7 (Edim)"E >> Fx "(A7)"ED ^ C2 | 1"Dm"D3DEF:| 2"Dm"D6 |
	T: Harmony
dfg |: "Dm"(a2f)g ba | "A7"g2e4 | "Gm"d >> e d ^ c dB | "A" ^ c3dfg | "Dm"(a2f)g ba | "A7"g2e4 |
	"Gm"d >> e "A7"dB AG | 1"Dm"F3dfg:| 2"Dm"F3FGA ||: "Gm"(B2F)G AB | "Dm"d2A4 | "Gm"d >> e "A7"dc dB |
	"Dm"d3 FGA | "Gm"(B2F)GAB | "Dm"d2A4 | "A7 (Edim)"G >> Ax "(A7)"GFE2 | 1"Dm"F3FGA:| 2"Dm"F6 |
	`,

	`
X:1
T:Pretty Little Liza
C:Paul Rosen
S:Copyright 2005, Paul Rosen
M:4/4
L:1/8
Q:106
R:old time
K:Am
"Am"A2AA c2dd|e2eg e2dc|A2AA c2dd|e2cc A2cc|"Em (G)"B2BB B2BB|
B2BB B2BB|"Am"A2AA c2dd|e2eg e2c2|"D"d2dd d2dd|d2dd d2cd|
"Am"e2cc A2c2|"G"BAG2 BAG2|"Am"A2AA A2AA|A2AA A2AA|:"Am"e4 a3e|"G"g2d2- d2eg|
"Am"a2aa ged2|"Em"e2ee e2ee|"Am"e4 a3e|"G"g2d2- d2Bc|"Em"d2e2 dcB2|"Am"A2AA A2AA:|
	`,

	`
X:50
T:Adieu My Native Land Adieu. JC.049
B:John Clare,Poet,Helpston. (1793-1864)
N:Song text exists. See Deacon.
A:Northamptonshire, England
Z:Village Music Project, 2000, Phil Headford
M:C
L:1/8
Q:2/4=60
K:D
[V:1]A|d3f (fe)(gf)|(fe)(dc) d3A|B2d2 A2d2|e/d/(c/d/ e)f{f}e3A|
[V:2]A|F3d (dc)(ed)|(AG)(FE) F3F|G2B2 F2A2|c/(B/A/B/ c)d{d}c3A|
%
[V:1]d3f (fe)(gf)|(fe)(dc) d3A|(B/c/d/c/ e/)d/(c/B/) Ad(fa)|geBc d3||
[V:2]F3d (dc)(ed)|(AG)(FE) F3F|(G/A/B/A/ c/)(B/A/G/)F2(df)|B2GE F3||
%
[V:1]f|eA^GB A3f|eA^GB {B}A3^e|(fc)(dA) BFGG|
[V:2]d|c2(Bd) c3d|c2(Bd) {d}c3^e|(fc)(dA) BFGz|
%
[V:1]g3f e3d|c3d e3A|g3f {f}e3d|"^DC"c3d A3|]
[V:2]AAAA AAAA|AAAA AAAz|e3d {d}c3d|E3D A3|]
	`,

	`
X: 51
T: Canzonetta a tre voci
C: Claudio Monteverdi (1567-1643)
M: C
L: 1/4
Q: "Andante mosso" 1/4 = 110
%%score [1 2 3]
V: 1 clef=treble name="Soprano"sname="A"
V: 2 clef=treble name="Alto"   sname="T"
V: 3 clef=bass   name="Tenor"  sname="B" octave=-2
K:Eb
% 1 - 4
[V: 1] |:z4  |z4  |f2ec         |_ddcc        |
w: Son que-sti~i cre-spi cri-ni~e
w: Que-sti son gli~oc-chi che mi-
[V: 2] |:c2BG|AAGc|(F/G/A/B/)c=A|B2AA         |
w: Son que-sti~i cre-spi cri-ni~e que - - - - sto~il vi-so e
w: Que-sti son~gli oc-chi che mi-ran - - - - do fi-so mi-
[V: 3] |:z4  |f2ec|_ddcf        |(B/c/_d/e/)ff|
w: Son que-sti~i cre-spi cri-ni~e que - - - - sto~il
w: Que-sti son~gli oc-chi che mi-ran - - - - do
[V: 1] cAB2     |cAAA |c3B|G2!fermata!Gz ::e4|
w: que-sto~il vi-so ond io ri-man-go~uc-ci-so. Deh,
w: ran-do fi-so, tut-to re-stai con-qui-so.
[V: 2] AAG2     |AFFF |A3F|=E2!fermata!Ez::c4|
w: que-sto~il vi-so ond' io ri-man-go~uc-ci-so. Deh,
w: ran-do fi-so tut-to re-stai con-qui-so.
[V: 3] (ag/f/e2)|A_ddd|A3B|c2!fermata!cz ::A4|
w: vi - - - so ond' io ti-man-go~uc-ci-so. Deh,
w: fi - - - so tut-to re-stai con-qui-so.
% 10 - 15
[V: 1] f_dec |B2c2|zAGF  |\
=EFG2          |1F2z2:|2F8|] % more notes
w: dim-me-lo ben mi-o, che que-sto\
sol de-si-o_. % more lyrics
[V: 2] ABGA  |G2AA|GF=EF |(GF3/2=E//D//E)|1F2z2:|2F8|]
w: dim-me-lo ben mi-o, che que-sto sol de-si - - - - o_.
[V: 3] _dBc>d|e2AF|=EFc_d|c4             |1F2z2:|2F8|]
w: dim-me-lo ben mi-o, che que-sto sol de-si-o_.
	`,

];

module.exports = {
	testABCStrings
};