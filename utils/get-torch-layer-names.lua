require 'nn'

local names = '';
for key, val in pairs(nn) do
    names = names .. "\n" .. key;
end

-- write to a file
local file = io.open('torch-names.txt', 'w');
io.output(file);
io.write(names);
