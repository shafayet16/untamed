def duplicate_encode(word):
    #store the word into an array where the letters are split side by side
    char_array = list(word)
    output = ""
    #count the letters and denote the ( and ) 
    for i in char_array:
        if char_array.count(i) < 2:
            output += "("
        else:
            output += ")"
    #join the letters together and print the output 
    return output

def effecient_duplicate_encode(word):
    return "".join(["(" if word.count(c.lower()) < 2 else ")" for c in word.lower()])

print(effecient_duplicate_encode("MeranLarkAhsan"))

def advanced_duplicate_encode(word):
    from collections import Counter
    counts = Counter(word.lower())
    return "".join(["(" if counts[c.lower()] < 2 else ")" for c in word])