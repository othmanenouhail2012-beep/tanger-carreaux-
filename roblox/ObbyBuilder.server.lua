-- ObbyBuilder : à placer dans ServerScriptService (Script, pas LocalScript)
local Players = game:GetService("Players")
local TweenService = game:GetService("TweenService")

local folder = Instance.new("Folder")
folder.Name = "Obby"
folder.Parent = workspace

local function makePart(props)
	local p = Instance.new("Part")
	p.Anchored = true
	p.TopSurface = Enum.SurfaceType.Smooth
	p.BottomSurface = Enum.SurfaceType.Smooth
	for k, v in pairs(props) do p[k] = v end
	p.Parent = props.Parent or folder
	return p
end

local NEON = {
	Color3.fromRGB(0, 255, 255), Color3.fromRGB(255, 0, 255), Color3.fromRGB(0, 255, 0),
	Color3.fromRGB(255, 255, 0), Color3.fromRGB(0, 128, 255), Color3.fromRGB(255, 128, 0),
	Color3.fromRGB(170, 0, 255), Color3.fromRGB(0, 255, 160), Color3.fromRGB(255, 0, 128),
	Color3.fromRGB(128, 255, 255),
}
local STEP_Z, STEP_Y = 18, 3
local MOVING = { [4] = true, [7] = true }
local CHECKPOINTS = { [3] = true, [6] = true, [9] = true }
local LAVA_ON = { [2] = 1, [5] = -1, [8] = 1 }

-- Départ
local start = makePart({ Name = "Depart", Size = Vector3.new(14, 1, 14), Position = Vector3.new(0, 0, 0),
	Color = Color3.fromRGB(200, 200, 200), Material = Enum.Material.SmoothPlastic })
local spawnLoc = Instance.new("SpawnLocation")
spawnLoc.Anchored, spawnLoc.Size, spawnLoc.Position = true, Vector3.new(6, 1, 6), Vector3.new(0, 1, 0)
spawnLoc.Transparency, spawnLoc.CanCollide = 1, false
spawnLoc.Parent = folder

-- Sol de lave sous tout le parcours
local function makeLava(size, pos)
	local lava = makePart({ Name = "Lave", Size = size, Position = pos, Color = Color3.fromRGB(255, 30, 0),
		Material = Enum.Material.Neon })
	lava.Touched:Connect(function(hit)
		local hum = hit.Parent and hit.Parent:FindFirstChildOfClass("Humanoid")
		if hum and hum.Health > 0 then hum.Health = 0 end
	end)
	return lava
end
makeLava(Vector3.new(80, 1, 230), Vector3.new(0, -12, 100))

local checkpointPos = {} -- [player] = CFrame
local function makeCheckpoint(pos)
	local cp = makePart({ Name = "Checkpoint", Size = Vector3.new(4, 0.4, 4), Position = pos,
		Color = Color3.fromRGB(255, 255, 255), Material = Enum.Material.Neon, CanCollide = false })
	cp.Touched:Connect(function(hit)
		local plr = Players:GetPlayerFromCharacter(hit.Parent)
		if plr then
			checkpointPos[plr] = CFrame.new(pos + Vector3.new(0, 3, 0))
			cp.Color = Color3.fromRGB(0, 255, 0)
		end
	end)
end

-- 10 plateformes
for i = 1, 10 do
	local pos = Vector3.new(0, i * STEP_Y, i * STEP_Z)
	local p = makePart({ Name = "Plateforme" .. i, Size = Vector3.new(12, 1, 12), Position = pos,
		Color = NEON[i], Material = Enum.Material.Neon })
	if MOVING[i] then
		p.Size = Vector3.new(8, 1, 8)
		p.Position = pos - Vector3.new(12, 0, 0)
		TweenService:Create(p, TweenInfo.new(3, Enum.EasingStyle.Sine, Enum.EasingDirection.InOut, -1, true),
			{ Position = pos + Vector3.new(12, 0, 0) }):Play()
	end
	if CHECKPOINTS[i] then makeCheckpoint(pos + Vector3.new(0, 0.7, 0)) end
	if LAVA_ON[i] then makeLava(Vector3.new(4, 1.2, 12), pos + Vector3.new(4 * LAVA_ON[i], 0.6, 0)) end
end

-- Arrivée dorée
local finishPos = Vector3.new(0, 11 * STEP_Y, 11 * STEP_Z)
local finish = makePart({ Name = "Arrivee", Size = Vector3.new(16, 1, 16), Position = finishPos,
	Color = Color3.fromRGB(255, 200, 0), Material = Enum.Material.Neon })
local gui = Instance.new("BillboardGui")
gui.Size, gui.StudsOffset, gui.AlwaysOnTop = UDim2.fromScale(10, 3), Vector3.new(0, 6, 0), true
gui.Parent = finish
local lbl = Instance.new("TextLabel")
lbl.Size, lbl.BackgroundTransparency, lbl.Text = UDim2.fromScale(1, 1), 1, "ARRIVÉE"
lbl.TextScaled, lbl.Font, lbl.TextColor3 = true, Enum.Font.FredokaOne, Color3.fromRGB(255, 215, 0)
lbl.TextStrokeTransparency = 0
lbl.Parent = gui

local confetti = Instance.new("ParticleEmitter")
confetti.Rate = 0
confetti.Lifetime = NumberRange.new(2, 4)
confetti.Speed = NumberRange.new(25, 40)
confetti.SpreadAngle = Vector2.new(60, 60)
confetti.Acceleration = Vector3.new(0, -30, 0)
confetti.Rotation, confetti.RotSpeed = NumberRange.new(0, 360), NumberRange.new(-300, 300)
confetti.Size = NumberSequence.new(0.4)
confetti.Color = ColorSequence.new({
	ColorSequenceKeypoint.new(0, Color3.fromRGB(255, 0, 0)), ColorSequenceKeypoint.new(0.33, Color3.fromRGB(0, 255, 0)),
	ColorSequenceKeypoint.new(0.66, Color3.fromRGB(0, 128, 255)), ColorSequenceKeypoint.new(1, Color3.fromRGB(255, 255, 0)),
})
confetti.Parent = finish

-- Chrono
local timers = {} -- [player] = { start = number, label = TextLabel, done = bool }

local function setupGui(plr)
	local sg = Instance.new("ScreenGui")
	sg.Name, sg.ResetOnSpawn = "Chrono", false
	local t = Instance.new("TextLabel")
	t.Size, t.Position, t.AnchorPoint = UDim2.fromOffset(220, 50), UDim2.new(0.5, 0, 0, 10), Vector2.new(0.5, 0)
	t.BackgroundColor3, t.BackgroundTransparency = Color3.new(0, 0, 0), 0.4
	t.TextColor3, t.TextScaled, t.Font, t.Text = Color3.new(1, 1, 1), true, Enum.Font.GothamBold, "⏱ 0.00 s"
	t.Parent = sg
	sg.Parent = plr:WaitForChild("PlayerGui")
	timers[plr] = { start = os.clock(), label = t, done = false }
end

finish.Touched:Connect(function(hit)
	local plr = Players:GetPlayerFromCharacter(hit.Parent)
	local t = plr and timers[plr]
	if t and not t.done then
		t.done = true
		local elapsed = os.clock() - t.start
		t.label.Text = string.format("🏁 %.2f s", elapsed)
		t.label.TextColor3 = Color3.fromRGB(255, 215, 0)
		confetti:Emit(250)
	end
end)

Players.PlayerAdded:Connect(function(plr)
	plr.CharacterAdded:Connect(function(char)
		local cf = checkpointPos[plr]
		if cf then
			local hrp = char:WaitForChild("HumanoidRootPart")
			task.wait() -- laisser le spawn par défaut se faire avant de téléporter
			char:PivotTo(cf)
		end
	end)
	setupGui(plr)
end)
Players.PlayerRemoving:Connect(function(plr)
	timers[plr], checkpointPos[plr] = nil, nil
end)

task.spawn(function()
	while true do
		for _, t in pairs(timers) do
			if not t.done then t.label.Text = string.format("⏱ %.2f s", os.clock() - t.start) end
		end
		task.wait(0.05)
	end
end)
