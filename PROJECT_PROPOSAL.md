# Project Proposal: Family Guys: United in Arms

## Group

| Name | abc123 username |
|---|---|
| Jose Mena | `jmm929` |
| Haig Shamlian | `hks55` |

## Repository

[https://github.com/JOMaMe/CS-375-Project](https://github.com/JOMaMe/CS-375-Project)

The repository is public. The group plans to provide access to the instructor.

- [ ] Confirm both group members have repository access.
- [ ] Grant the instructor access using the Canvas username(s) and instructions.

## Project description

Our group name is Family Guys: United in Arms, and the game we plan on making is The Evil Amongst Us, it will be a browser-based, multiplayer dungeon-crawling
RPG for up to four players. The party explores and battles together in
traditional turn-based play. One player is secretly the imposter: they can see
the full dungeon map while the rest of the party navigates without that
information. The imposter can bluff or mislead the party, but cannot secretly
change the party's route or a choice's outcome.

The party works toward finding the dungeon objective. Finding it triggers a
final, player-controlled battle against the imposter. The imposter's stats and
abilities scale with the level they reached during the run. If the whole party
dies before finding the objective, the run ends and everyone loses.

The project will use the existing Node.js and Express application, with
WebSockets to keep players in the same room up to date. No external APIs are
currently planned.

## Planned features

- [x] Players can create or join a party room, share a room code, and see the
  party roster and connection status.
- [x] The party explores together in turns, with the navigator role rotating
  through the party.
- [x] One party member is randomly assigned as the hidden imposter. The
  imposter sees the full map; other players do not.
- [x] Navigation can affect encounter chances, loot, and opportunities to find
  or upgrade items and weapons.
- [x] Battles use turns, with initiative rolled once at the start of each
  battle. Characters can attack, defend, use items, and use class skills.
- [x] The four classes have different roles: Cleric (healing and revival),
  Fighter (resilience and protecting allies), Rogue (agility and conditional
  critical hits), and Wizard (dark magic, support, and damage).
- [x] Cooperative and role-appropriate play can earn bonus XP. Characters can
  level up during a run and gain advantages.
- [x] Downed players become spectators, can offer one support action per
  battle, and may be revived. Each player starts with a revive scroll.
- [x] Finding the objective starts a final battle against the player-controlled
  imposter, even if the imposter is downed. The battle's outcome determines the
  winner unless the whole party died before finding the objective.
- [x] The server validates actions and keeps game state consistent and private
  to the correct party room. The client shows action results and run outcomes.

The exact combat balance, XP and level formulas, revival rules, and dungeon
generation details are still being discussed. Active-time
battles, accounts, persistent progression between runs, voice/video chat, and
multi-server matchmaking are outside the planned scope.

## APIs and external services

No external APIs are planned. Multiplayer updates will use WebSockets between
the browser client and this project's server; no paid API tier is expected.

## Collaboration plan

### Experience and division of work

- **Jose Mena:** Has some React experience, but describes his coding confidence
  as low. He is comfortable contributing ideas and helping work through
  problems.
- **Haig Shamlian:** Describes his web-development skills as low-to-mid range
  and has some game-design experience. He is confident applying that
  experience to web development.

We will share the work and assign tasks using a lightweight Agile process.
Jose can take first passes on browser UI/client work, and Haig can help lead
game-rule and game-logic work. These are starting points, not exclusive
ownership: we will distribute tasks between both members, pair on unfamiliar
work, and review each other's changes.

### Meetings and communication

We are roommates, so we can talk about the project in person throughout the
week. We also use Discord direct messages, and we check in with the professor
during Thursday class.

- **Dedicated weekly work meeting:** Not set yet. We will agree on a recurring
  time, duration, and location if informal check-ins are not enough.
- **Communication channel:** Discord direct messages.

### Task tracking

We will use Trello as our primary task board and GitHub for the code and
repository work. We will use Trello to assign task owners, track status, and
coordinate the work using Agile/Scrum-style check-ins.

### Obstacles and how we will handle them

- **Jose:** Works at least 30 hours per week across weekday and weekend jobs,
  has a heavy course load with anatomy and physiology classes, and has senior
  year graduation requirements to manage. We will communicate busy weeks
  early, plan tasks around his available time, and split work into manageable
  pieces.
- **Haig:** Has many other group final projects in a heavy courseload this term. Has Armenian cultural responsibilities that take up much of most
  weekends and needs to prepare for co-op cycles and finding a job. We will
  plan weekend-sensitive tasks ahead of time and account for co-op and job
  preparation in task assignments.

### Weekly time commitment

We expect the project to take about 12-20 team hours per week in total. Jose
and Haig each estimate that they can contribute about 6-10 hours per week.
These are estimates and may change during busy work, exam, or co-op periods.

### Keeping the workload fair

We are okay with a reasonable, temporary difference in workload, but not with
one person carrying most of the project while the other contributes very
little. If the workload becomes uneven, we will discuss it and redistribute
tasks.

### If someone misses commitments

We will talk directly and early, using Discord or an in-person conversation,
to understand what is blocking the work and agree on a realistic next step.
We will use our check-ins to follow up, adjust task size or ownership, and
rebalance the work if needed. If the same commitments continue to be missed,
we will discuss the issue during a Thursday professor check-in and ask for
guidance.
