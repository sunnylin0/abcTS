const testABCStrings = [
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
	`];

module.exports = {
	testABCStrings
};