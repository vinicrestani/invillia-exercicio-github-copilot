document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Reset select options to avoid duplicates
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Helper: get initials from name/email
      function getInitials(text) {
        if (!text) return "";
        // se for email, use parte antes do @
        const base = text.includes("@") ? text.split("@")[0] : text;
        const parts = base.split(/[\s._-]+/).filter(Boolean);
        if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
      }

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const participants = Array.isArray(details.participants) ? details.participants : [];
        const spotsLeft = (details.max_participants || 0) - participants.length;

        // Base content
        activityCard.innerHTML = `
          <h4>${name} <small style="font-weight:600;color:#666;font-size:12px;margin-left:6px;">(${participants.length} inscritos)</small></h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
        `;

        // Build participants list as chips (DOM)
        if (participants.length > 0) {
          const headerP = document.createElement("p");
          headerP.innerHTML = "<strong>Participants:</strong>";
          activityCard.appendChild(headerP);

          const ul = document.createElement("ul");
          ul.className = "participants";

          participants.forEach((p) => {
            const li = document.createElement("li");
            li.className = "participant-item";

            const avatar = document.createElement("span");
            avatar.className = "avatar";
            avatar.textContent = getInitials(p);

            const nameSpan = document.createElement("span");
            nameSpan.className = "participant-name";
            nameSpan.textContent = p;
            nameSpan.title = p; // tooltip com email/nome completo

            li.appendChild(avatar);
            li.appendChild(nameSpan);
            ul.appendChild(li);
          });

          // Se atividade cheia, adicionar classe visual
          if (spotsLeft <= 0) {
            activityCard.classList.add("activity-full");
          }

          activityCard.appendChild(ul);
        } else {
          const empty = document.createElement("div");
          empty.className = "participants-empty";
          empty.textContent = "Nenhum participante inscrito ainda.";
          activityCard.appendChild(empty);
        }

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        // Prefer name/participant returned pelo backend, fallback para email
        const participantName = result.participant || result.name || email;
        messageDiv.textContent = `${participantName} inscrito com sucesso.`;
        messageDiv.className = "success";
        signupForm.reset();

        // Atualiza a lista imediatamente para mostrar o novo participante
        await fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
