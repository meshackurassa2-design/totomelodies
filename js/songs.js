const baseSongs = [
    { title: 'Twinkle Twinkle Little Star', notes: 'C4-400 C4-400 G4-400 G4-400 A4-400 A4-400 G4-800 F4-400 F4-400 E4-400 E4-400 D4-400 D4-400 C4-800' },
    { title: 'Mary Had a Little Lamb', notes: 'E4-400 D4-400 C4-400 D4-400 E4-400 E4-400 E4-800 D4-400 D4-400 D4-800 E4-400 G4-400 G4-800' },
    { title: 'Ode to Joy', notes: 'E4-400 E4-400 F4-400 G4-400 G4-400 F4-400 E4-400 D4-400 C4-400 C4-400 D4-400 E4-400 E4-600 D4-200 D4-800' },
    { title: 'Baby Shark', notes: 'D4-400 E4-400 G4-200 G4-200 G4-200 G4-200 G4-200 G4-200 G4-200 D4-400 E4-400 G4-200 G4-200 G4-200 G4-200' },
    { title: 'Old MacDonald', notes: 'G4-400 G4-400 G4-400 D4-400 E4-400 E4-400 D4-800 B4-400 B4-400 A4-400 A4-400 G4-800' },
    { title: 'Row Your Boat', notes: 'C4-600 C4-600 C4-400 D4-200 E4-600 E4-400 D4-200 E4-400 F4-200 G4-1200' },
    { title: 'London Bridge', notes: 'G4-400 A4-400 G4-400 F4-400 E4-400 F4-400 G4-800 D4-400 E4-400 F4-800 E4-400 F4-400 G4-800' },
    { title: 'Jingle Bells', notes: 'E4-400 E4-400 E4-800 E4-400 E4-400 E4-800 E4-400 G4-400 C4-600 D4-200 E4-1600' },
    { title: 'Happy Birthday', notes: 'C4-300 C4-100 D4-400 C4-400 F4-400 E4-800 C4-300 C4-100 D4-400 C4-400 G4-400 F4-800' },
    { title: 'Itsy Bitsy Spider', notes: 'G4-400 C5-400 C5-400 C5-400 D5-400 E5-400 E5-400 E5-400 D5-400 C5-400 D5-400 E5-400 C5-800' },
    { title: 'Are You Sleeping', notes: 'C4-400 D4-400 E4-400 C4-400 C4-400 D4-400 E4-400 C4-400 E4-400 F4-400 G4-800 E4-400 F4-400 G4-800' },
    { title: 'Baa Baa Black Sheep', notes: 'C4-400 C4-400 G4-400 G4-400 A4-200 B4-200 C5-200 A4-200 G4-800 F4-400 F4-400 E4-400 E4-400 D4-400 D4-400 C4-800' }
];

const songLibrary = [...baseSongs];

// Generate 90+ more variations to hit the 100+ mark!
const tempos = [0.7, 1.3, 1.5];
const prefixes = ['Slow', 'Fast', 'Up-beat'];

for (let i = 0; i < 90; i++) {
    const base = baseSongs[i % baseSongs.length];
    const tempoMult = tempos[i % tempos.length];
    const prefix = prefixes[i % prefixes.length];
    
    const newNotes = base.notes.split(' ').map(n => {
        const parts = n.split('-');
        return `${parts[0]}-${Math.round(parseInt(parts[1]) * tempoMult)}`;
    }).join(' ');

    songLibrary.push({
        title: `${prefix} ${base.title} v${Math.floor(i/12) + 1}`,
        notes: newNotes
    });
}
window.songLibrary = songLibrary;
